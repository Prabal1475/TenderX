import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';

const TEMPLATES = [
  { id: 'Compliance_Matrix', label: 'Technical Compliance Matrix', desc: 'Clause-by-clause compliance table format' },
  { id: 'Cover_Letter', label: 'Bid Submission Cover Letter', desc: 'Official letter with PAN, GSTIN, EMD exemption' },
  { id: 'Technical_Bid', label: 'Technical Proposal Narrative', desc: 'Architecture, methodology, SLAs, and warranties' },
  { id: 'Experience_Summary', label: 'Past Experience & Credentials', desc: 'Summary of past contracts and client references' },
];

export default function BidStudioPage({ initialTenderId }) {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState(initialTenderId || '');
  const [template, setTemplate] = useState('Compliance_Matrix');
  const [customInstructions, setCustomInstructions] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const tList = await api.listTenders();
        setTenders(tList);
        if (!selectedTenderId && tList.length > 0) {
          setSelectedTenderId(tList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

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
    const genPromise = api
      .generateBidDocument(selectedTenderId, template, customInstructions)
      .then((newDraft) => {
        setDrafts((prev) => [newDraft, ...prev]);
        selectDraft(newDraft);
        return newDraft;
      });

    toast.promise(genPromise, {
      loading: 'RAG Engine synthesizing proposal from credentials...',
      success: 'AI proposal draft created successfully!',
      error: (err) => `Generation failed: ${err.message}`,
    });

    try {
      await genPromise;
    } catch {
      // Handled by toast
    } finally {
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
    a.download = `${activeDraft.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded proposal as Markdown');
  };

  const selectedTender = tenders.find((t) => t.id === selectedTenderId);

  return (
    <div className="space-y-6 animate-cascade">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Bid Document Studio & RAG Proposal Generator
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Synthesize technical compliance matrices and tender proposals from company credentials with human-in-the-loop review
        </p>
      </div>

      {/* Tender & Generator Control Bar */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tender Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Indian Tender
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => setSelectedTenderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bid Template Type
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
            >
              {TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Instruction & Generate Action */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Directives (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Highlight ISO 27001, Make-in-India Class-1 supplier..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {selectedTender ? (
              <span>
                Authority: <strong className="text-slate-200">{selectedTender.authority}</strong>
              </span>
            ) : null}
          </span>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedTenderId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>{generating ? 'RAG Engine Synthesizing...' : 'Generate AI Proposal Draft'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Revision Reviewer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Drawer: Draft Versions List */}
        <div className="lg:col-span-1 glass-panel p-4 rounded-3xl space-y-3">
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
                  className={`p-3 rounded-2xl cursor-pointer border text-xs btn-tactile active:scale-[0.98] ${
                    activeDraft?.id === d.id
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                      : 'border-slate-800 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{d.doc_type.replace('_', ' ')}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        d.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : d.status === 'Under_Review'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
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
        <div className="lg:col-span-3 glass-panel p-5 rounded-3xl space-y-4">
          {activeDraft ? (
            <>
              {/* Draft Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white">{activeDraft.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span>Status:</span>
                    <select
                      value={activeDraft.status}
                      onChange={(e) => handleSave(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-teal-300 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
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
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 btn-tactile active:scale-[0.97]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .MD</span>
                  </button>
                </div>
              </div>

              {/* RAG Context Citations Banner */}
              {activeDraft.rag_citations?.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                  <span className="font-semibold text-teal-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Referenced Vault Documents (RAG Citations):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeDraft.rag_citations.map((cite, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700"
                      >
                        {cite.document_name} ({cite.category})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual-Pane Editor & Markdown Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1">Human-in-the-Loop Editor (Markdown)</p>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={18}
                    className="w-full p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
                    placeholder="Proposal content..."
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1">Formatted Document Preview</p>
                  <div className="h-[370px] overflow-y-auto p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {editedText}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-500 text-sm">
              Select or generate a proposal draft to begin review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
