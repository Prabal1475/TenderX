import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Calendar,
  Building,
  MapPin,
  FileText,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatINR, formatDate, getDaysRemaining } from '../utils/formatters';

export default function TenderDiscoveryPage({ onSelectTender, onOpenStudio }) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (portal) params.portal = portal;
      if (category) params.category = category;
      if (search) params.search = search;
      const data = await api.listTenders(params);
      setTenders(data);
    } catch (err) {
      console.error('Error fetching tenders:', err);
      toast.error('Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [portal, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTenders();
  };

  const handleIngest = async (source) => {
    setSyncing(true);
    const promise = api.ingestTenders(source, true).then(fetchTenders);
    toast.promise(promise, {
      loading: `Ingesting ${source} tender feeds...`,
      success: `${source} tenders indexed and available!`,
      error: (err) => `Ingestion failed: ${err.message}`,
    });
    try {
      await promise;
    } catch {
      // Handled by toast.promise
    } finally {
      setSyncing(false);
    }
  };

  const handleBookmarkToggle = async (e, tender) => {
    e.stopPropagation();
    const newStatus = tender.status === 'Bookmarked' ? 'Active' : 'Bookmarked';
    try {
      await api.updateTenderStatus(tender.id, newStatus);
      setTenders((prev) =>
        prev.map((t) => (t.id === tender.id ? { ...t, status: newStatus } : t))
      );
      if (newStatus === 'Bookmarked') {
        toast.success(`Bookmarked tender ${tender.tender_id}`);
      } else {
        toast('Bookmark removed');
      }
    } catch (err) {
      toast.error(`Bookmark update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Tender Discovery & Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search Indian Government tenders across GeM and Central Public Procurement Portal (CPPP)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleIngest('GeM')}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            + Ingest GeM Feeds
          </button>
          <button
            onClick={() => handleIngest('CPPP')}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            + Ingest CPPP Feeds
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tender title, GeM BID number, authority, or technical keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm btn-tactile active:scale-[0.97]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-teal-400" /> Filter:
          </span>

          {/* Portal Filter */}
          <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
            {['', 'GeM', 'CPPP'].map((p) => (
              <button
                key={p}
                onClick={() => setPortal(p)}
                className={`px-3 py-1.5 rounded-lg font-medium btn-tactile active:scale-[0.98] ${
                  portal === p
                    ? 'bg-slate-800 text-teal-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === '' ? 'All Portals' : p}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
            {['', 'Goods', 'Services', 'Works'].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg font-medium btn-tactile active:scale-[0.98] ${
                  category === c
                    ? 'bg-slate-800 text-teal-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === '' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tender List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full skeleton" />
                    <div className="h-5 w-24 rounded skeleton" />
                  </div>
                  <div className="h-5 w-3/4 rounded skeleton" />
                  <div className="h-4 w-1/2 rounded skeleton" />
                </div>
                <div className="h-10 w-24 rounded skeleton hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      ) : tenders.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl animate-cascade">
          <p className="text-slate-400 text-sm font-semibold">No tenders match your filters.</p>
          <button
            onClick={() => handleIngest('all')}
            className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs btn-tactile active:scale-[0.97]"
          >
            Ingest Sample Bids
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tenders.map((tender, idx) => {
            const daysLeft = getDaysRemaining(tender.submission_deadline);
            const isBookmarked = tender.status === 'Bookmarked';

            return (
              <div
                key={tender.id}
                onClick={() => onSelectTender(tender.id)}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 cursor-pointer interactive-hover btn-tactile active:scale-[0.99] group animate-cascade"
                style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Title & Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          tender.portal === 'GeM'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {tender.portal}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        {tender.tender_id}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {tender.category}
                      </span>
                      {tender.msme_exemption && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          MSME EMD Exempt
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                      {tender.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {tender.authority}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {tender.location_state || 'All India'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Values & Actions */}
                  <div className="flex sm:items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] font-semibold text-slate-400">Estimated Value</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        {formatINR(tender.estimated_value_inr)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        EMD: {formatINR(tender.emd_amount_inr)}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[11px] font-semibold text-slate-400">Deadline</p>
                      <p className="text-xs font-semibold text-slate-200">
                        {formatDate(tender.submission_deadline).split(',')[0]}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {daysLeft}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleBookmarkToggle(e, tender)}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Tender'}
                        className={`p-2.5 rounded-xl border btn-tactile active:scale-[0.94] ${
                          isBookmarked
                            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                            : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStudio(tender.id);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-teal-500/10 btn-tactile active:scale-[0.96]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Draft Bid</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
