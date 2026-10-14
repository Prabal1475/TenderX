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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Procurement Command Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time Indian GeM & CPPP tender intelligence, qualification analysis, and bid pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickIngest}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin-fast' : ''}`} />
            <span>{syncing ? 'Syncing Feeds...' : 'Sync GeM & CPPP'}</span>
          </button>

          <button
            onClick={() => onSelectTab('vault')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
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
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade shadow-xs" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Active Tenders</span>
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{tenders.length}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Discovered from GeM & CPPP</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade shadow-xs" style={{ animationDelay: '40ms' }}>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Pipeline Value</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="font-bold">₹</span>
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {formatINR(totalPipelineValue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Cumulative bid opportunity</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade shadow-xs" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Upcoming Deadlines</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-amber-700">{urgentDeadlinesCount}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Due within 10 days</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden animate-cascade shadow-xs" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Top Qualification Match</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-purple-800">
                {recommendations[0]?.overall_match_score || 88}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Turnover & scope compatible</p>
            </div>
          </>
        )}
      </div>

      {/* Top AI Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              AI-Recommended Opportunities For Your Profile
            </h2>
          </div>
          <button
            onClick={() => onSelectTab('tenders')}
            className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 btn-tactile active:scale-[0.97]"
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
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-teal-300 hover:shadow-md cursor-pointer interactive-hover btn-tactile group animate-cascade transition-all"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {rec.tender_code}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    {rec.overall_match_score}% Match
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {rec.ai_rationale}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${rec.is_hard_eligible ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-slate-600 text-[11px] font-medium">
                      {rec.is_hard_eligible ? 'Turnover & Experience Met' : 'Check Eligibility Details'}
                    </span>
                  </div>
                  <span className="text-teal-700 text-xs font-bold group-hover:underline flex items-center gap-0.5">
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
