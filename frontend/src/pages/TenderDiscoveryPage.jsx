import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowUpRight,
  X,
  SlidersHorizontal,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatINR, formatDate, getDaysRemaining } from '../utils/formatters';

export default function TenderDiscoveryPage({ onSelectTender, onOpenStudio }) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState('');
  const [category, setCategory] = useState(''); // Type: Goods, Services, Works
  const [eligibilityFilter, setEligibilityFilter] = useState('all'); // 'all' | 'matched' | 'msme' | 'ineligible'
  const [search, setSearch] = useState('');
  const [expandedTenderId, setExpandedTenderId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (portal) params.portal = portal;
      if (category) params.category = category;
      if (eligibilityFilter && eligibilityFilter !== 'all') params.eligibility = eligibilityFilter;
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
  }, [portal, category, eligibilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTenders();
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setPortal('');
    setCategory('');
    setEligibilityFilter('all');
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

  // Real-time omni-search matching across: Title/Name, Type/Category, Eligibility (MSME, ISO, Turnover, Exp), Department, ID
  const filteredTenders = useMemo(() => {
    return tenders.filter((tender) => {
      // 1. Portal filter
      if (portal && tender.portal.toLowerCase() !== portal.toLowerCase()) {
        return false;
      }

      // 2. Type / Category filter
      if (category && tender.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }

      // 3. Eligibility filter
      const isEligible = Boolean(tender.is_hard_eligible || (tender.overall_match_score || 0) >= 60);
      const hasMsmeBenefit = Boolean(tender.msme_exemption || tender.startup_exemption);

      if (eligibilityFilter === 'matched' && !isEligible) {
        return false;
      }
      if (eligibilityFilter === 'ineligible' && isEligible) {
        return false;
      }
      if (eligibilityFilter === 'msme' && !hasMsmeBenefit) {
        return false;
      }

      // 4. Omnisearch query
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        const tokens = query.split(/\s+/).filter(Boolean);

        const titleMatch = tender.title && tender.title.toLowerCase().includes(query);
        const idMatch = (tender.tender_id && tender.tender_id.toLowerCase().includes(query)) || (tender.id && tender.id.toLowerCase().includes(query));
        const deptMatch = tender.authority && tender.authority.toLowerCase().includes(query);
        const typeMatch = tender.category && tender.category.toLowerCase().includes(query);
        const locMatch = tender.location_state && tender.location_state.toLowerCase().includes(query);
        const descMatch = tender.description && tender.description.toLowerCase().includes(query);

        // Eligibility criteria matching
        const crit = tender.eligibility_criteria || {};
        const certs = Array.isArray(crit.required_certifications) ? crit.required_certifications : [];
        const certMatch = certs.some((c) => c.toLowerCase().includes(query));
        const turnoverMatch = crit.min_turnover_cr != null && (
          String(crit.min_turnover_cr).includes(query) ||
          `${crit.min_turnover_cr} cr`.toLowerCase().includes(query) ||
          (query.includes('turnover') && crit.min_turnover_cr > 0)
        );
        const expMatch = crit.min_experience_years != null && (
          String(crit.min_experience_years).includes(query) ||
          `${crit.min_experience_years} year`.toLowerCase().includes(query) ||
          (query.includes('exp') && crit.min_experience_years > 0)
        );

        const statusMatch =
          (query.includes('ineligib') || query.includes('disqualif')) ? !isEligible :
          (query.includes('eligib') || query.includes('qualif') || query.includes('fit') || query.includes('matched')) ? isEligible :
          (query.includes('msme') || query.includes('exempt') || query.includes('startup') || query.includes('waiver')) ? hasMsmeBenefit :
          false;

        // Multi-token match support
        const tokensMatch = tokens.length > 1 && tokens.every((tok) => {
          const t = tok.toLowerCase();
          return (
            (tender.title && tender.title.toLowerCase().includes(t)) ||
            (tender.tender_id && tender.tender_id.toLowerCase().includes(t)) ||
            (tender.authority && tender.authority.toLowerCase().includes(t)) ||
            (tender.category && tender.category.toLowerCase().includes(t)) ||
            (tender.location_state && tender.location_state.toLowerCase().includes(t)) ||
            (tender.description && tender.description.toLowerCase().includes(t)) ||
            certs.some((c) => c.toLowerCase().includes(t)) ||
            (t.includes('msme') && hasMsmeBenefit) ||
            (t.includes('eligib') && isEligible)
          );
        });

        if (
          !titleMatch &&
          !idMatch &&
          !deptMatch &&
          !typeMatch &&
          !locMatch &&
          !descMatch &&
          !certMatch &&
          !turnoverMatch &&
          !expMatch &&
          !statusMatch &&
          !tokensMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tenders, portal, category, eligibilityFilter, search]);

  const hasActiveFilters = Boolean(portal || category || eligibilityFilter !== 'all' || search.trim());
  const qualifiedCount = tenders.filter((t) => (t.overall_match_score || 0) >= 60 || t.is_hard_eligible).length;

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
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tender name, title, ID, type (Goods/Services/Works), department, eligibility (MSME, ISO, turnover)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick Search Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-teal-600" /> Quick tags:
          </span>
          {[
            { label: 'Northern Railway', action: () => setSearch('Northern Railway') },
            { label: 'Works', action: () => setCategory('Works') },
            { label: 'Services', action: () => setCategory('Services') },
            { label: 'Goods', action: () => setCategory('Goods') },
            { label: 'MSME Exemption', action: () => setEligibilityFilter('msme') },
            { label: 'ISO 9001', action: () => setSearch('ISO 9001') },
            { label: 'Qualified Only', action: () => setEligibilityFilter('matched') },
          ].map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={tag.action}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200 text-slate-600 transition-colors btn-tactile text-[11px] font-medium"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-teal-600" /> Filters:
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

          {/* Category / Type Filter */}
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
                {c === '' ? 'All Types' : c}
              </button>
            ))}
          </div>

          {/* Eligibility Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Eligibility' },
              { id: 'matched', label: '✨ Qualified (≥60%)' },
              { id: 'msme', label: '⚡ MSME Benefit' },
              { id: 'ineligible', label: '❌ Ineligible (<60%)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setEligibilityFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium btn-tactile active:scale-[0.98] ${
                  eligibilityFilter === f.id
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold btn-tactile active:scale-[0.97] transition-colors"
              title="Reset all active search and filter criteria"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          {/* Matched / Total Tenders Count Badge */}
          <div className="sm:ml-auto flex items-center">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>
                <strong>{qualifiedCount}</strong> Matched / <strong>{tenders.length}</strong> Total Tenders
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* List count summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-medium px-1 gap-2">
        <span>
          Showing <strong className="text-slate-900">{filteredTenders.length}</strong> tenders
          {search ? ` matching "${search}"` : ''}
          {category ? ` in ${category}` : ''}
          {eligibilityFilter !== 'all' ? ` (${eligibilityFilter})` : ''}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
          <span><strong>{qualifiedCount}</strong> qualified for your company profile</span>
          <span className="text-slate-300">•</span>
          <span><strong>{tenders.length}</strong> total discovered bids</span>
        </span>
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
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl animate-cascade shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-800 text-base font-bold">No tenders match your search criteria.</p>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              {search
                ? `No tenders found matching "${search}". Try searching by a different name, type (Goods/Services/Works), department, or eligibility criteria.`
                : 'Try adjusting your portal, category, or eligibility filters.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs btn-tactile active:scale-[0.97]"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={() => handleIngest('all')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
            >
              Ingest Fresh Bids
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTenders.map((tender, idx) => {
              const daysLeft = getDaysRemaining(tender.submission_deadline);
              const isBookmarked = tender.status === 'Bookmarked';
              const isMatched = (tender.overall_match_score || 0) >= 60 || tender.is_hard_eligible;
              const matchScore = typeof tender.overall_match_score === 'number'
                ? tender.overall_match_score
                : (isMatched ? 85 : 40);
              const isExpanded = expandedTenderId === tender.id;
              const crit = tender.eligibility_criteria || {};

              return (
                <div
                  key={tender.id}
                  onClick={() => setExpandedTenderId((prev) => (prev === tender.id ? null : tender.id))}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer interactive-hover btn-tactile ${
                    isExpanded
                      ? 'border-teal-400 shadow-md ring-1 ring-teal-500/20'
                      : 'border-slate-200/90 hover:border-teal-300 hover:shadow-sm'
                  } group animate-cascade`}
                  style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: ID, Title, Department */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Portal Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            tender.portal === 'GeM'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {tender.portal}
                        </span>

                        {/* Tender ID - Prominently Displayed */}
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300 shadow-2xs">
                          ID: {tender.tender_id}
                        </span>

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {tender.category}
                        </span>

                        {tender.msme_exemption && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            MSME EMD Exempt
                          </span>
                        )}

                        {/* Matching Score in Every Card */}
                        <span
                          className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                            isMatched
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={isMatched ? 'Company profile satisfies eligibility criteria' : 'Eligibility shortfall risk detected'}
                        >
                          <Sparkles className={`w-3 h-3 ${isMatched ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span>{matchScore}% Match</span>
                        </span>
                      </div>

                      {/* Tender Title */}
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                        {tender.title}
                      </h2>

                      {/* Department / Authority - Explicitly Highlighted */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Building className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="text-slate-500 font-semibold">Department:</span>
                          <strong className="text-slate-900 font-bold">{tender.authority}</strong>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tender.location_state || 'All India'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Price, Qualification, Deadline & Expand Action */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 lg:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Price / Estimated Value - Prominently Displayed */}
                      <div className="text-left sm:text-right bg-emerald-50/50 p-2 sm:p-2.5 rounded-xl border border-emerald-100 shrink-0">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Price / Value</p>
                        <p className="text-base sm:text-lg font-black text-emerald-700">
                          {formatINR(tender.estimated_value_inr)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          EMD: {formatINR(tender.emd_amount_inr)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</p>
                        {isMatched ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Shortfall
                          </span>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
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
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm shadow-teal-700/20 btn-tactile active:scale-[0.96]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Draft</span>
                        </button>

                        <div
                          className={`p-2 rounded-xl border border-slate-200 text-slate-500 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors ${
                            isExpanded ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-50'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE SECTION: Description, Requirements & All Other Details */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-5 pt-5 border-t border-slate-200/90 space-y-5 cursor-default animate-view-fade"
                    >
                      {/* 1. Scope of Work & Description */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Scope of Work & Technical Description
                          </h3>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-line shadow-2xs">
                          {tender.description || 'No detailed scope of work published for this tender.'}
                        </div>
                      </div>

                      {/* 2. Mandatory Eligibility Requirements Grid */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Mandatory Eligibility Requirements
                            </h3>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Evaluated against company credentials
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Financial Turnover Requirement */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-semibold text-[11px]">Financial Turnover Gate</span>
                              {crit.min_turnover_cr <= 6.5 || (tender.msme_exemption && crit.min_turnover_cr <= 13.0) ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Shortfall
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              ₹{crit.min_turnover_cr || 5.0} Cr Required
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              3-year average. {tender.msme_exemption ? 'MSME 50% relaxation applies.' : 'Mandatory hard threshold.'}
                            </p>
                          </div>

                          {/* Experience Requirement */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-semibold text-[11px]">Experience Track Record</span>
                              {crit.min_experience_years <= 6 ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Shortfall
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              {crit.min_experience_years || 3} Years Required
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              Prior completed government / PSU work orders.
                            </p>
                          </div>

                          {/* Past Project Value Percentage */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-semibold text-[11px]">Single Project Value</span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                Criteria
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              {crit.past_project_value_pct || 50}% of Value
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              Min value of any single executed past contract.
                            </p>
                          </div>

                          {/* EMD Exemption & Policy */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-semibold text-[11px]">EMD Fee Policy</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  tender.msme_exemption
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {tender.msme_exemption ? 'Waiver Applied' : 'Full Payment'}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              {formatINR(tender.emd_amount_inr)}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {tender.msme_exemption
                                ? '100% waiver under Rule 170 GFR 2017.'
                                : 'Upfront bank guarantee / FDR required.'}
                            </p>
                          </div>
                        </div>

                        {/* Required Certifications Badges */}
                        {crit.required_certifications?.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-slate-700 text-[11px] mr-1">
                              Mandatory Certifications:
                            </span>
                            {crit.required_certifications.map((cert) => (
                              <span
                                key={cert}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>{cert}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. Tender Specifics, Dates & Document Links */}
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block">Department / Ministry</span>
                          <strong className="text-slate-900 font-bold block mt-0.5">{tender.authority}</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block">Technical Bid Opening</span>
                          <strong className="text-slate-900 font-bold block mt-0.5">
                            {tender.opening_date ? formatDate(tender.opening_date) : 'Post closing date'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block">Jurisdiction / Location</span>
                          <strong className="text-slate-900 font-bold block mt-0.5">
                            {tender.location_state || 'All India'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block">Official Tender RFP Notice</span>
                          {tender.document_url ? (
                            <a
                              href={tender.document_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline mt-0.5"
                            >
                              <span>Official Notice PDF</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400 mt-0.5 block">Notice on portal</span>
                          )}
                        </div>
                      </div>

                      {/* 4. Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-semibold">AI Match Rationale:</span>
                          <span className="font-medium text-slate-700">
                            {isMatched
                              ? 'Meets turnover, experience and statutory compliance requirements for this department.'
                              : 'Disqualification risk detected: check mandatory turnover or experience requirements.'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTender(tender.id);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs btn-tactile active:scale-[0.97] flex items-center gap-1.5"
                          >
                            <span>Full Engine Analysis</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudio(tender.id);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-700/20 btn-tactile active:scale-[0.97] flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Draft Bid in Studio</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
