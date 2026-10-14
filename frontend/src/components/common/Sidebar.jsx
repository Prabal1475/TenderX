import React from 'react';
import {
  LayoutDashboard,
  Search,
  FolderLock,
  FileEdit,
  CalendarCheck,
  Building2,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tenders', label: 'Tender Discovery', icon: Search },
  { id: 'vault', label: 'Document Vault', icon: FolderLock },
  { id: 'studio', label: 'Bid Studio', icon: FileEdit },
  { id: 'tasks', label: 'Tasks & Deadlines', icon: CalendarCheck },
  { id: 'profile', label: 'Company Profile', icon: Building2 },
];

export default function Sidebar({ currentTab, onSelectTab }) {
  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between p-4 shrink-0 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
      <nav className="space-y-1">
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm btn-tactile active:scale-[0.98] transition-all duration-150 ${
                isActive
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors duration-150 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-800">Local AI / RAG Online</span>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Embeddings & proposal synthesis operating local-first without cloud API lock-in.
        </p>
      </div>
    </aside>
  );
}
