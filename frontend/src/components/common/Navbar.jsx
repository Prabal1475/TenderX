import React from 'react';
import { Shield, Sparkles, RotateCcw, LogOut, ChevronDown } from 'lucide-react';
import { useDemo } from '../../demo/DemoContext';

export default function Navbar({ user, onLogout }) {
  const { isDemoMode, currentScenario, switchScenario, resetDemoData, disableDemoMode } = useDemo();

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-700/15">
          <Shield className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-800 to-emerald-700 bg-clip-text text-transparent">
            TenderX
          </span>
          <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 hidden sm:inline-block">
            India GeM & CPPP
          </span>
        </div>
      </div>

      {/* Demo Controls Bar */}
      {isDemoMode && (
        <div className="flex items-center gap-2 sm:gap-3 bg-teal-50/80 border border-teal-200/80 rounded-2xl p-1.5 px-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="hidden md:inline">VC Demo:</span>
          </div>

          <div className="relative">
            <select
              value={currentScenario}
              onChange={(e) => switchScenario(e.target.value)}
              className="bg-white text-slate-800 border border-teal-200/90 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 cursor-pointer pr-7 shadow-xs"
            >
              <option value="scenario_1">Scenario 1: GeM Railway CCTV (94% Fit)</option>
              <option value="scenario_2">Scenario 2: NHAI FastTag (42% Disqualified)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
          </div>

          <button
            onClick={resetDemoData}
            title="Reset Demo Data to Initial State"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-teal-200/80 text-xs font-semibold shadow-xs transition-colors btn-tactile"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{user?.full_name || 'Tender Manager'}</p>
            <p className="text-[10px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              if (isDemoMode) disableDemoMode();
              onLogout();
            }}
            title="Sign out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 btn-tactile active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
