import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatINR, formatDate, getDaysRemaining } from '../utils/formatters';

export default function TenderDetailPage({ tenderId, onBack, onOpenStudio }) {
  const [tender, setTender] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const t = await api.getTender(tenderId);
        setTender(t);
        const score = await api.evaluateTender(tenderId).catch(() => null);
        setMatchScore(score);
      } catch (err) {
        console.error('Failed to load tender:', err);
        toast.error('Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [tenderId]);

  const handleReEvaluate = async () => {
    setEvaluating(true);
    const evalPromise = api.evaluateTender(tenderId).then((score) => {
      setMatchScore(score);
      return score;
    });
    toast.promise(evalPromise, {
      loading: 'Recalculating AI qualification match...',
      success: 'AI evaluation updated with latest profile credentials!',
      error: (err) => `Evaluation error: ${err.message}`,
    });
    try {
      await evalPromise;
    } catch {
      // Handled by toast
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-cascade">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 rounded skeleton" />
          <div className="h-9 w-44 rounded-xl skeleton" />
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full skeleton" />
            <div className="h-5 w-28 rounded skeleton" />
          </div>
          <div className="h-7 w-3/4 rounded skeleton" />
          <div className="h-4 w-1/2 rounded skeleton" />
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="h-6 w-1/3 rounded skeleton" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 rounded-2xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-20 glass-panel rounded-3xl animate-cascade">
        <p className="text-slate-400">Tender not found.</p>
        <button onClick={onBack} className="mt-4 text-xs text-teal-400 hover:underline btn-tactile active:scale-[0.97]">
          Return to Discovery
        </button>
      </div>
    );
  }

  const crit = tender.eligibility_criteria || {};

  return (
    <div className="space-y-6 animate-cascade">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 btn-tactile active:scale-[0.97]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tenders</span>
        </button>

        <button
          onClick={() => onOpenStudio(tender.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
        >
          <FileEdit className="w-4 h-4" />
          <span>Open Bid Document Studio</span>
        </button>
      </div>

      {/* Tender Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {tender.portal}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {tender.tender_id}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {tender.category}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {tender.location_state || 'All India'}
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
          {tender.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-400" />
            <strong className="text-slate-700 font-semibold">Authority:</strong> {tender.authority}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <strong className="text-slate-700 font-semibold">Deadline:</strong> {formatDate(tender.submission_deadline)}
          </span>
          {tender.document_url && (
            <a
              href={tender.document_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-teal-700 font-semibold hover:text-teal-900 hover:underline"
            >
              <span>Official Notice PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* AI Qualification & Match Breakdown */}
      {matchScore && (
        <div
          className={`bg-white p-6 rounded-3xl border shadow-sm space-y-6 ${
            matchScore.overall_match_score >= 70 ? 'border-teal-200' : 'border-rose-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                  matchScore.overall_match_score >= 70
                    ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-teal-700/20'
                    : 'bg-gradient-to-tr from-rose-600 to-amber-500 shadow-rose-700/20'
                }`}
              >
                {matchScore.overall_match_score}%
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>AI Qualification & Match Engine</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      matchScore.overall_match_score >= 70
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {matchScore.overall_match_score >= 70 ? 'High Fit (Recommended)' : 'Critical Disqualification Alert'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Calculated against your company profile using hard eligibility rules + pgvector cosine similarity
                </p>
              </div>
            </div>

            <button
              onClick={handleReEvaluate}
              disabled={evaluating}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs btn-tactile active:scale-[0.97]"
            >
              {evaluating ? 'Re-calculating...' : 'Re-run Evaluation'}
            </button>
          </div>

          {/* AI Rationale Summary */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-teal-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Executive Rationale:
            </p>
            {matchScore.ai_rationale}
          </div>

          {/* Eligibility Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Turnover Check */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Financial Turnover Gate</span>
                {matchScore.turnover_check?.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <p className="text-slate-600 text-[11px]">
                Required: <strong className="text-slate-900 font-bold">₹{matchScore.turnover_check?.required_cr} Cr</strong> vs
                Your: <strong className="text-slate-900 font-bold">₹{matchScore.turnover_check?.company_cr} Cr</strong>
              </p>
              {matchScore.turnover_check?.relaxed_via_msme && (
                <span className="inline-block text-[10px] text-teal-700 font-bold">
                  ✓ Qualified under MSME 50% relaxation
                </span>
              )}
            </div>

            {/* Past Experience Check */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Experience Track Record</span>
                {matchScore.experience_check?.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <p className="text-slate-600 text-[11px]">
                Required: <strong className="text-slate-900 font-bold">{matchScore.experience_check?.required_years} Years</strong> vs
                Your: <strong className="text-slate-900 font-bold">{matchScore.experience_check?.company_years} Years</strong>
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Based on registration and contracts</span>
            </div>

            {/* MSME Exemption Benefit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">MSME EMD Exemption</span>
                <span className="text-emerald-700 font-bold">Waiver Applied</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                EMD Saved: <strong className="text-emerald-700 font-bold">{formatINR(matchScore.msme_benefit?.emd_amount_saved_inr)}</strong>
              </p>
              <span className="text-[10px] text-teal-700 font-bold">
                No bank guarantee / FDR required upfront
              </span>
            </div>
          </div>

          {/* Risk Factors Alert */}
          {matchScore.risk_factors?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Qualification Risks Identified:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 pl-1">
                {matchScore.risk_factors.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Scope of Work Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Scope of Work & Technical Description</h2>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line font-mono text-xs">
          {tender.description || 'No detailed scope text available.'}
        </div>
      </div>
    </div>
  );
}
