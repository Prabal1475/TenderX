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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Tender Discovery & Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search Indian Government tenders across GeM and Central Public Procurement Portal (CPPP)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleIngest('GeM')}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 btn-tactile active:scale-[0.97] disabled:opacity-50 shadow-xs"
          >
            + Ingest GeM Feeds
          </button>
          <button
            onClick={() => handleIngest('CPPP')}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 btn-tactile active:scale-[0.97] disabled:opacity-50 shadow-xs"
          >
            + Ingest CPPP Feeds
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tender title, GeM BID number, authority, or technical keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-teal-600" /> Filter:
          </span>

          {/* Portal Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {['', 'GeM', 'CPPP'].map((p) => (
              <button
                key={p}
                onClick={() => setPortal(p)}
                className={`px-3 py-1.5 rounded-lg font-medium btn-tactile active:scale-[0.98] ${
                  portal === p
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === '' ? 'All Portals' : p}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {['', 'Goods', 'Services', 'Works'].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg font-medium btn-tactile active:scale-[0.98] ${
                  category === c
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl animate-cascade shadow-xs">
          <p className="text-slate-600 text-sm font-semibold">No tenders match your filters.</p>
          <button
            onClick={() => handleIngest('all')}
            className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
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
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-teal-300 hover:shadow-md cursor-pointer interactive-hover btn-tactile active:scale-[0.99] group animate-cascade transition-all"
                style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Title & Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          tender.portal === 'GeM'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {tender.portal}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {tender.tender_id}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {tender.category}
                      </span>
                      {tender.msme_exemption && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          MSME EMD Exempt
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {tender.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-700 font-semibold">{tender.authority}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {tender.location_state || 'All India'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Values & Actions */}
                  <div className="flex sm:items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] font-semibold text-slate-500">Estimated Value</p>
                      <p className="text-lg font-black text-emerald-700">
                        {formatINR(tender.estimated_value_inr)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        EMD: {formatINR(tender.emd_amount_inr)}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[11px] font-semibold text-slate-500">Deadline</p>
                      <p className="text-xs font-bold text-slate-800">
                        {formatDate(tender.submission_deadline).split(',')[0]}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {daysLeft}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleBookmarkToggle(e, tender)}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Tender'}
                        className={`p-2.5 rounded-xl border btn-tactile active:scale-[0.94] ${
                          isBookmarked
                            ? 'bg-teal-50 border-teal-300 text-teal-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStudio(tender.id);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm shadow-teal-700/20 btn-tactile active:scale-[0.96]"
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
