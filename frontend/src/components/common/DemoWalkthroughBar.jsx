import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  FolderArchive,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useDemo } from '../../demo/DemoContext';

export default function DemoWalkthroughBar({ onNavigateTab, onSelectTender }) {
  const { isDemoMode, activeTourStep, setActiveTourStep, getActiveTender } = useDemo();
  const [collapsed, setCollapsed] = useState(false);

  if (!isDemoMode) return null;

  const activeTender = getActiveTender();

  const steps = [
    {
      id: 1,
      title: '1. Tender Discovery',
      tab: 'tenders',
      pitchTip: 'Showcase unified GeM & CPPP filtering in ₹ Crores & urgency countdowns.',
      action: () => {
        setActiveTourStep(1);
        onNavigateTab('tenders');
      },
    },
    {
      id: 2,
      title: '2. AI Qualification Gate',
      tab: 'tender-detail',
      pitchTip: 'Demonstrate hard eligibility gates (Turnover, MSME GFR 170 relaxations).',
      action: () => {
        setActiveTourStep(2);
        onSelectTender(activeTender.id);
      },
    },
    {
      id: 3,
      title: '3. Credential Vault',
      tab: 'vault',
      pitchTip: 'Point out past PSU work completion certificates used for RAG grounding.',
      action: () => {
        setActiveTourStep(3);
        onNavigateTab('vault');
      },
    },
    {
      id: 4,
      title: '4. Bid Studio RAG & Export',
      tab: 'studio',
      pitchTip: 'Generate clause-by-clause compliance matrix and export printable bid package.',
      action: () => {
        setActiveTourStep(4);
        onNavigateTab('studio');
      },
    },
  ];

  const currentStepObj = steps.find((s) => s.id === activeTourStep) || steps[0];

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Step buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 pl-1 pr-2 border-r border-slate-200 hidden sm:inline-block">
            Pitch Flow:
          </span>

          {steps.map((step) => {
            const isActive = activeTourStep === step.id;
            return (
              <button
                key={step.id}
                onClick={step.action}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap btn-tactile ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{step.title}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>

        {/* Next Step Shortcut Button */}
        <div className="flex items-center gap-2">
          {activeTourStep < 4 ? (
            <button
              onClick={() => {
                const nextStep = activeTourStep + 1;
                const nextStepObj = steps.find((s) => s.id === nextStep);
                if (nextStepObj) nextStepObj.action();
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1 transition-colors btn-tactile active:scale-[0.97]"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => steps[0].action()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors btn-tactile active:scale-[0.97]"
            >
              Restart Pitch
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            title="Toggle Pitch Tip"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Pitch Tip Banner */}
      {!collapsed && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span className="font-semibold text-teal-800">Founder Pitch Tip:</span>
          <span className="text-slate-600 text-xs">{currentStepObj.pitchTip}</span>
        </div>
      )}
    </div>
  );
}
