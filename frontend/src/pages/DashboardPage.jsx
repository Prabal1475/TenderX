import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  FolderUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatINR, formatDate, getDaysRemaining } from '../utils/formatters';

export default function DashboardPage({ onNavigateTender, onSelectTab }) {
  const [tenders, setTenders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      const [tList, recList] = await Promise.all([
        api.listTenders(),
        api.getTopRecommendations().catch(() => []),
      ]);
      setTenders(tList);
      setRecommendations(recList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickIngest = async () => {
    setSyncing(true);
    const ingestPromise = api.ingestTenders('all', true).then(loadData);
    toast.promise(ingestPromise, {
      loading: 'Syncing live GeM & CPPP tender feeds...',
      success: 'Tender intelligence repository updated successfully!',
      error: (err) => `Ingestion error: ${err.message}`,
    });
    try {
      await ingestPromise;
    } catch {
      // Handled by toast.promise
    } finally {
      setSyncing(false);
    }
  };

  const totalPipelineValue = tenders.reduce(
    (acc, cur) => acc + (cur.estimated_value_inr || 0),
    0
  );

  const urgentDeadlinesCount = tenders.filter((t) => {
    const diff = (new Date(t.submission_deadline) - new Date()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 10;
  }).length;

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Procurement Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Indian GeM & CPPP tender intelligence, qualification analysis, and bid pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickIngest}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin-fast' : ''}`} />
            <span>{syncing ? 'Syncing Feeds...' : 'Sync GeM & CPPP'}</span>
          </button>

          <button
            onClick={() => onSelectTab('vault')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/10"
          >
            <FolderUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Credentials</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 rounded skeleton" />
                <div className="h-6 w-6 rounded-lg skeleton" />
              </div>
              <div className="h-7 w-28 rounded skeleton" />
              <div className="h-2.5 w-32 rounded skeleton" />
            </div>
          ))
        ) : (
          <>
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Active Tenders</span>
                <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">{tenders.length}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">Discovered from GeM & CPPP</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade" style={{ animationDelay: '40ms' }}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Pipeline Value</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <span className="font-bold">₹</span>
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400">
                {formatINR(totalPipelineValue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">Cumulative bid opportunity</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Upcoming Deadlines</span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-amber-400">{urgentDeadlinesCount}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">Due within 10 days</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Top Qualification Match</span>
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-extrabold text-purple-300">
                {recommendations[0]?.overall_match_score || 88}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">Turnover & scope compatible</p>
            </div>
          </>
        )}
      </div>

      {/* Top AI Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              AI-Recommended Opportunities For Your Profile
            </h2>
          </div>
          <button
            onClick={() => onSelectTab('tenders')}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 btn-tactile active:scale-[0.97]"
          >
            <span>View All Tenders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="h-5 w-20 rounded-full skeleton" />
                </div>
                <div className="h-4 w-3/4 rounded skeleton" />
                <div className="h-3 w-full rounded skeleton" />
                <div className="h-3 w-2/3 rounded skeleton" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div
                key={rec.tender_id}
                onClick={() => onNavigateTender(rec.tender_id)}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-teal-500/40 cursor-pointer interactive-hover btn-tactile group animate-cascade"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                    {rec.tender_code}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    {rec.overall_match_score}% Match
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-2 mb-2">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {rec.ai_rationale}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${rec.is_hard_eligible ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-slate-300 text-[11px]">
                      {rec.is_hard_eligible ? 'Turnover & Experience Met' : 'Check Eligibility Details'}
                    </span>
                  </div>
                  <span className="text-teal-400 text-xs font-semibold group-hover:underline flex items-center gap-0.5">
                    Analyze <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
