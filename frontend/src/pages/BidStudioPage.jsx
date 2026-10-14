import React, { useEffect, useState, useRef } from 'react';
import {
  FileEdit,
  Sparkles,
  Download,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  ChevronRight,
  BookOpen,
  Printer,
  Copy,
  X,
  FileText,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useDemo } from '../demo/DemoContext';

const TEMPLATES = [
  { id: 'Compliance_Matrix', label: 'Technical Compliance Matrix', desc: 'Clause-by-clause compliance table format' },
  { id: 'Cover_Letter', label: 'Bid Submission Cover Letter', desc: 'Official letter with PAN, GSTIN, EMD exemption' },
  { id: 'Technical_Bid', label: 'Technical Proposal Narrative', desc: 'Architecture, methodology, SLAs, and warranties' },
  { id: 'Experience_Summary', label: 'Past Experience & Credentials', desc: 'Summary of past contracts and client references' },
];

export default function BidStudioPage({ initialTenderId }) {
  const { isDemoMode, getActiveTender } = useDemo();
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState(initialTenderId || '');
  const [template, setTemplate] = useState('Compliance_Matrix');
  const [customInstructions, setCustomInstructions] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const streamIntervalRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tList = await api.listTenders();
        setTenders(tList);
        if (!selectedTenderId && tList.length > 0) {
          if (isDemoMode) {
            const demoT = getActiveTender();
            const match = tList.find((t) => t.id === demoT.id || t.tender_id === demoT.tender_id);
            setSelectedTenderId(match ? match.id : tList[0].id);
          } else {
            setSelectedTenderId(tList[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isDemoMode]);

  const loadDraftsForTender = async (tId) => {
    if (!tId) return;
    try {
      const data = await api.listBidDocuments(tId);
      setDrafts(data);
      if (data.length > 0) {
        selectDraft(data[0]);
      } else {
        setActiveDraft(null);
        setEditedText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedTenderId) {
      loadDraftsForTender(selectedTenderId);
    }
  }, [selectedTenderId]);

  const selectDraft = (draft) => {
    setActiveDraft(draft);
    setEditedText(draft.edited_content || draft.drafted_content);
  };

  const handleGenerate = async () => {
    if (!selectedTenderId) return;
    setGenerating(true);

    try {
      toast.loading('RAG Engine querying Document Vault & synthesizing proposal...', { id: 'rag-gen' });
      const newDraft = await api.generateBidDocument(selectedTenderId, template, customInstructions);
      toast.dismiss('rag-gen');

      // Fast streaming animation in demo mode or standard presentation
      const fullContent = newDraft.edited_content || newDraft.drafted_content;
      setDrafts((prev) => [newDraft, ...prev.filter((d) => d.id !== newDraft.id)]);
      setActiveDraft(newDraft);

      let currentPos = 0;
      const chunkSize = Math.max(35, Math.floor(fullContent.length / 20));
      setEditedText('');

      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

      streamIntervalRef.current = setInterval(() => {
        currentPos += chunkSize;
        if (currentPos >= fullContent.length) {
          clearInterval(streamIntervalRef.current);
          setEditedText(fullContent);
          setGenerating(false);
          toast.success('AI proposal draft synthesized with citations!');
        } else {
          setEditedText(fullContent.slice(0, currentPos));
        }
      }, 45);
    } catch (err) {
      toast.dismiss('rag-gen');
      toast.error(`Generation failed: ${err.message}`);
      setGenerating(false);
    }
  };

  const handleSave = async (status) => {
    if (!activeDraft) return;
    setSaving(true);
    const savePromise = api
      .updateBidDocument(activeDraft.id, {
        edited_content: editedText,
        status: status || activeDraft.status,
      })
      .then((updated) => {
        setActiveDraft(updated);
        setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        return updated;
      });

    toast.promise(savePromise, {
      loading: 'Saving proposal draft...',
      success: 'Proposal changes saved!',
      error: (err) => `Save failed: ${err.message}`,
    });

    try {
      await savePromise;
    } catch {
      // Handled by toast
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!activeDraft) return;
    const blob = new Blob([editedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeDraft.title || 'bid_proposal').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded proposal as Markdown');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    toast.success('Proposal copied to clipboard!');
  };

  const selectedTender = tenders.find((t) => t.id === selectedTenderId);

  return (
    <div className="space-y-6 animate-cascade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bid Document Studio & RAG Proposal Generator
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Synthesize clause-by-clause compliance statements and tender bids grounded in company credential vault
          </p>
        </div>

        {activeDraft && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Export Official Bid Package</span>
            </button>
          </div>
        )}
      </div>

      {/* Tender & Generator Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tender Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Indian Tender
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => setSelectedTenderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
            >
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.portal}] {t.tender_id} - {t.title.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bid Template Type
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
            >
              {TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Instruction */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Custom Directives (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Cite ISO 27001, GFR 170 EMD exemption, Class-1 supplier..."
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {selectedTender ? (
              <span>
                Procuring Authority: <strong className="text-slate-800">{selectedTender.authority}</strong>
              </span>
            ) : null}
          </span>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedTenderId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 stroke-[2.5] ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'RAG Synthesizing Proposal...' : 'Generate AI Proposal Draft'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Revision Reviewer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Drawer: Draft Versions List */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Draft Versions ({drafts.length})
          </h2>

          {drafts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No proposal drafts generated yet. Click "Generate AI Proposal Draft" above.
            </p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => selectDraft(d)}
                  className={`p-3 rounded-2xl cursor-pointer border text-xs btn-tactile active:scale-[0.98] transition-all ${
                    activeDraft?.id === d.id
                      ? 'bg-teal-50 border-teal-300 text-teal-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{d.doc_type.replace('_', ' ')}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        d.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : d.status === 'Under_Review'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Area: Split-Screen Markdown Editor & Preview */}
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          {activeDraft ? (
            <>
              {/* Draft Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{activeDraft.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>Status:</span>
                    <select
                      value={activeDraft.status}
                      onChange={(e) => handleSave(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-teal-800 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Under_Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Exported">Exported</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs btn-tactile active:scale-[0.97]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>

                  <button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs btn-tactile active:scale-[0.97]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .MD</span>
                  </button>
                </div>
              </div>

              {/* RAG Context Citations Banner */}
              {activeDraft.rag_citations?.length > 0 && (
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-1.5">
                  <span className="font-bold text-teal-800 flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Grounding Proof (RAG Citations from Document Vault):
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeDraft.rag_citations.map((cite, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white text-teal-800 font-mono text-[11px] border border-teal-200 shadow-xs flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        {cite.document_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual-Pane Editor & Markdown Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Human-in-the-Loop Editor
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">{editedText.length} characters</span>
                  </div>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={18}
                    className="w-full p-4 bg-slate-50/70 border border-slate-300 rounded-2xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 leading-relaxed resize-none"
                    placeholder="Proposal content..."
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Live Formatted Preview
                  </p>
                  <div className="h-[390px] overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans select-text">
                    {editedText}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-400 text-sm">
              Select or generate a proposal draft to begin review.
            </div>
          )}
        </div>
      </div>

      {/* Export Official Bid Package Modal (Print / PDF) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Government Bid Submission Package</h3>
                  <p className="text-[11px] text-slate-500">Formatted per GeM / CPPP GFR 2017 Submission Standards</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Printable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed text-xs">
              {/* Official Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
                <h2 className="text-lg font-black tracking-wide uppercase text-slate-950 font-sans">
                  Apex Enterprise Solutions Pvt Ltd
                </h2>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                  Regd Office: 402, Technology Tower, Okhla Industrial Area Phase-III, New Delhi - 110020
                </p>
                <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-mono mt-1">
                  <span>CIN: U72200DL2018PTC334455</span>
                  <span>|</span>
                  <span>GSTIN: 07AAACA9876K1Z9</span>
                  <span>|</span>
                  <span>PAN: AAACA9876K</span>
                  <span>|</span>
                  <span>Udyam: UDYAM-DL-01-0098765</span>
                </div>
              </div>

              {/* Reference Header */}
              <div className="flex justify-between items-start mb-6 text-[11px] font-sans">
                <div>
                  <p><strong>Bid Ref No:</strong> AES/TENDER/2026/089</p>
                  <p><strong>Target Tender:</strong> {selectedTender?.tender_id || 'GEM/2026/B/8912401'}</p>
                  <p><strong>Procuring Entity:</strong> {selectedTender?.authority || 'Northern Railway Headquarter, Baroda House'}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Submission Portal:</strong> {selectedTender?.portal || 'GeM (Government e-Marketplace)'}</p>
                  <p><strong>Classification:</strong> Class-I Local Supplier (MII)</p>
                </div>
              </div>

              {/* Bid Content */}
              <div className="space-y-4 whitespace-pre-line text-xs font-sans text-slate-800 leading-relaxed border-t border-b border-slate-200 py-6">
                {editedText}
              </div>

              {/* Official Seal & Signature */}
              <div className="mt-8 pt-4 flex justify-between items-end font-sans">
                <div className="text-[10px] text-slate-500">
                  <p>Digitally Signed & Certified</p>
                  <p>Verified through TenderX AI Qualification Engine</p>
                </div>

                <div className="text-right">
                  <div className="inline-block border-b border-slate-400 w-44 mb-2" />
                  <p className="font-bold text-xs text-slate-900">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-600">For Apex Enterprise Solutions Pvt Ltd</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
