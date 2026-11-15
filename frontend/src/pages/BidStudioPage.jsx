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
  Columns,
  Eye,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  Quote,
  Minus,
  Check,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useDemo } from '../demo/DemoContext';
import MarkdownViewer from '../components/common/MarkdownViewer';

const TEMPLATES = [
  { id: 'Compliance_Matrix', label: 'Technical Compliance Matrix', desc: 'Clause-by-clause compliance table format' },
  { id: 'Cover_Letter', label: 'Bid Submission Cover Letter', desc: 'Official letter with PAN, GSTIN, EMD exemption' },
  { id: 'Technical_Bid', label: 'Technical Proposal Narrative', desc: 'Architecture, methodology, SLAs, and warranties' },
  { id: 'Experience_Summary', label: 'Past Experience & Credentials', desc: 'Summary of past contracts and client references' },
];

export default function BidStudioPage({ initialTenderId, user }) {
  const { isDemoMode, getActiveTender } = useDemo();
  const isViewer = user?.role === 'viewer';
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
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large'
  const streamIntervalRef = useRef(null);
  const textareaRef = useRef(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    h2: false,
    h3: false,
    bullet: false,
    number: false,
    quote: false,
  });

  const checkActiveFormats = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedText;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextNewline = text.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;
    const lineText = text.substring(lineStart, lineEnd);

    const isH3 = lineText.startsWith('### ');
    const isH2 = !isH3 && lineText.startsWith('## ');
    const isBullet = /^(\s*)[-*]\s+/.test(lineText);
    const isNumber = /^(\s*)\d+\.\s+/.test(lineText);
    const isQuote = /^(\s*)>\s*/.test(lineText);

    let isBold = false;
    let isItalic = false;

    if (start < end) {
      const sel = text.substring(start, end);
      if (sel.startsWith('**') && sel.endsWith('**') && sel.length >= 4) {
        isBold = true;
      } else if (start >= 2 && end <= text.length - 2 && text.substring(start - 2, start) === '**' && text.substring(end, end + 2) === '**') {
        isBold = true;
      }

      if (sel.startsWith('*') && sel.endsWith('*') && !sel.startsWith('**') && !sel.endsWith('**') && sel.length >= 2) {
        isItalic = true;
      } else if (start >= 1 && end <= text.length - 1) {
        const b1 = text.charAt(start - 1);
        const a1 = text.charAt(end);
        const b2 = start >= 2 ? text.charAt(start - 2) : '';
        const a2 = end + 1 < text.length ? text.charAt(end + 1) : '';
        if (b1 === '*' && b2 !== '*' && a1 === '*' && a2 !== '*') {
          isItalic = true;
        }
      }
    } else {
      const col = start - lineStart;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match;
      while ((match = boldRegex.exec(lineText)) !== null) {
        if (col >= match.index && col <= match.index + match[0].length) {
          isBold = true;
          break;
        }
      }

      const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
      while ((match = italicRegex.exec(lineText)) !== null) {
        if (col >= match.index && col <= match.index + match[0].length) {
          isItalic = true;
          break;
        }
      }
    }

    setActiveFormats({
      bold: isBold,
      italic: isItalic,
      h2: isH2,
      h3: isH3,
      bullet: isBullet,
      number: isNumber,
      quote: isQuote,
    });
  };

  useEffect(() => {
    checkActiveFormats();
  }, [editedText]);

  const toggleInlineFormatting = (type) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedText;

    if (type === 'bold') {
      const marker = '**';
      const mLen = 2;

      if (start < end) {
        const sel = text.substring(start, end);
        // Case 1: Selection starts and ends with **
        if (sel.startsWith(marker) && sel.endsWith(marker) && sel.length >= 4) {
          const inner = sel.substring(mLen, sel.length - mLen);
          const newText = text.substring(0, start) + inner + text.substring(end);
          setEditedText(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + inner.length);
            checkActiveFormats();
          }, 0);
          return;
        }

        // Case 2: Selection surrounded by **
        if (
          start >= mLen &&
          end <= text.length - mLen &&
          text.substring(start - mLen, start) === marker &&
          text.substring(end, end + mLen) === marker
        ) {
          const newText = text.substring(0, start - mLen) + sel + text.substring(end + mLen);
          setEditedText(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start - mLen, end - mLen);
            checkActiveFormats();
          }, 0);
          return;
        }

        // Case 3: Toggle ON
        const replacement = `${marker}${sel}${marker}`;
        const newText = text.substring(0, start) + replacement + text.substring(end);
        setEditedText(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + mLen, start + mLen + sel.length);
          checkActiveFormats();
        }, 0);
      } else {
        // Cursor only (no selection)
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const nextNewline = text.indexOf('\n', start);
        const lineEnd = nextNewline === -1 ? text.length : nextNewline;
        const lineText = text.substring(lineStart, lineEnd);
        const col = start - lineStart;

        const boldRegex = /\*\*([^*]+)\*\*/g;
        let match;
        let insideMatch = null;
        while ((match = boldRegex.exec(lineText)) !== null) {
          const mStart = match.index;
          const mEnd = mStart + match[0].length;
          if (col >= mStart && col <= mEnd) {
            insideMatch = {
              globalStart: lineStart + mStart,
              globalEnd: lineStart + mEnd,
              inner: match[1],
            };
            break;
          }
        }

        if (insideMatch) {
          // Toggle OFF
          const newText = text.substring(0, insideMatch.globalStart) + insideMatch.inner + text.substring(insideMatch.globalEnd);
          setEditedText(newText);
          const newCursor = Math.max(insideMatch.globalStart, Math.min(newText.length, start - mLen));
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
            checkActiveFormats();
          }, 0);
        } else {
          // Toggle ON
          const wordMatch = lineText.substring(0, col).match(/(\w+)$/);
          const afterWordMatch = lineText.substring(col).match(/^(\w+)/);
          if (wordMatch || afterWordMatch) {
            const wordStartRel = wordMatch ? col - wordMatch[1].length : col;
            const wordEndRel = afterWordMatch ? col + afterWordMatch[1].length : col;
            const word = lineText.substring(wordStartRel, wordEndRel);
            const gStart = lineStart + wordStartRel;
            const gEnd = lineStart + wordEndRel;
            const newText = text.substring(0, gStart) + `${marker}${word}${marker}` + text.substring(gEnd);
            setEditedText(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(gStart + mLen, gStart + mLen + word.length);
              checkActiveFormats();
            }, 0);
          } else {
            const placeholder = 'bold text';
            const newText = text.substring(0, start) + `${marker}${placeholder}${marker}` + text.substring(end);
            setEditedText(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + mLen, start + mLen + placeholder.length);
              checkActiveFormats();
            }, 0);
          }
        }
      }
    } else if (type === 'italic') {
      const marker = '*';
      const mLen = 1;

      if (start < end) {
        const sel = text.substring(start, end);
        if (sel.startsWith('*') && sel.endsWith('*') && !sel.startsWith('**') && !sel.endsWith('**') && sel.length >= 2) {
          const inner = sel.substring(1, sel.length - 1);
          const newText = text.substring(0, start) + inner + text.substring(end);
          setEditedText(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + inner.length);
            checkActiveFormats();
          }, 0);
          return;
        }

        if (start >= 1 && end <= text.length - 1) {
          const b1 = text.charAt(start - 1);
          const a1 = text.charAt(end);
          const b2 = start >= 2 ? text.charAt(start - 2) : '';
          const a2 = end + 1 < text.length ? text.charAt(end + 1) : '';
          if (b1 === '*' && b2 !== '*' && a1 === '*' && a2 !== '*') {
            const newText = text.substring(0, start - 1) + sel + text.substring(end + 1);
            setEditedText(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start - 1, end - 1);
              checkActiveFormats();
            }, 0);
            return;
          }
        }

        const replacement = `${marker}${sel}${marker}`;
        const newText = text.substring(0, start) + replacement + text.substring(end);
        setEditedText(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + mLen, start + mLen + sel.length);
          checkActiveFormats();
        }, 0);
      } else {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const nextNewline = text.indexOf('\n', start);
        const lineEnd = nextNewline === -1 ? text.length : nextNewline;
        const lineText = text.substring(lineStart, lineEnd);
        const col = start - lineStart;

        const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
        let match;
        let insideMatch = null;
        while ((match = italicRegex.exec(lineText)) !== null) {
          const mStart = match.index;
          const mEnd = mStart + match[0].length;
          if (col >= mStart && col <= mEnd) {
            insideMatch = {
              globalStart: lineStart + mStart,
              globalEnd: lineStart + mEnd,
              inner: match[1],
            };
            break;
          }
        }

        if (insideMatch) {
          const newText = text.substring(0, insideMatch.globalStart) + insideMatch.inner + text.substring(insideMatch.globalEnd);
          setEditedText(newText);
          const newCursor = Math.max(insideMatch.globalStart, Math.min(newText.length, start - mLen));
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
            checkActiveFormats();
          }, 0);
        } else {
          const wordMatch = lineText.substring(0, col).match(/(\w+)$/);
          const afterWordMatch = lineText.substring(col).match(/^(\w+)/);
          if (wordMatch || afterWordMatch) {
            const wordStartRel = wordMatch ? col - wordMatch[1].length : col;
            const wordEndRel = afterWordMatch ? col + afterWordMatch[1].length : col;
            const word = lineText.substring(wordStartRel, wordEndRel);
            const gStart = lineStart + wordStartRel;
            const gEnd = lineStart + wordEndRel;
            const newText = text.substring(0, gStart) + `${marker}${word}${marker}` + text.substring(gEnd);
            setEditedText(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(gStart + mLen, gStart + mLen + word.length);
              checkActiveFormats();
            }, 0);
          } else {
            const placeholder = 'italic text';
            const newText = text.substring(0, start) + `${marker}${placeholder}${marker}` + text.substring(end);
            setEditedText(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + mLen, start + mLen + placeholder.length);
              checkActiveFormats();
            }, 0);
          }
        }
      }
    }
  };

  const toggleLineFormatting = (type) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedText;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextNewline = text.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;
    const lineText = text.substring(lineStart, lineEnd);

    let newLineText = lineText;
    let cursorOffset = 0;

    if (type === 'h2') {
      if (lineText.startsWith('## ')) {
        newLineText = lineText.substring(3);
        cursorOffset = -3;
      } else if (lineText.startsWith('### ')) {
        newLineText = '## ' + lineText.substring(4);
        cursorOffset = -1;
      } else {
        newLineText = '## ' + lineText.replace(/^#+\s*/, '');
        cursorOffset = newLineText.length - lineText.length;
      }
    } else if (type === 'h3') {
      if (lineText.startsWith('### ')) {
        newLineText = lineText.substring(4);
        cursorOffset = -4;
      } else if (lineText.startsWith('## ')) {
        newLineText = '### ' + lineText.substring(3);
        cursorOffset = 1;
      } else {
        newLineText = '### ' + lineText.replace(/^#+\s*/, '');
        cursorOffset = newLineText.length - lineText.length;
      }
    } else if (type === 'bullet') {
      if (/^(\s*)[-*]\s+/.test(lineText)) {
        newLineText = lineText.replace(/^(\s*)[-*]\s+/, '$1');
        cursorOffset = newLineText.length - lineText.length;
      } else {
        const stripped = lineText.replace(/^(\s*)\d+\.\s+/, '$1');
        newLineText = '- ' + stripped;
        cursorOffset = newLineText.length - lineText.length;
      }
    } else if (type === 'number') {
      if (/^(\s*)\d+\.\s+/.test(lineText)) {
        newLineText = lineText.replace(/^(\s*)\d+\.\s+/, '$1');
        cursorOffset = newLineText.length - lineText.length;
      } else {
        const stripped = lineText.replace(/^(\s*)[-*]\s+/, '$1');
        newLineText = '1. ' + stripped;
        cursorOffset = newLineText.length - lineText.length;
      }
    } else if (type === 'quote') {
      if (/^(\s*)>\s*/.test(lineText)) {
        newLineText = lineText.replace(/^(\s*)>\s*/, '$1');
        cursorOffset = newLineText.length - lineText.length;
      } else {
        newLineText = '> ' + lineText;
        cursorOffset = 2;
      }
    }

    const newText = text.substring(0, lineStart) + newLineText + text.substring(lineEnd);
    setEditedText(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursor = Math.max(lineStart, Math.min(newText.length, start + cursorOffset));
      textarea.setSelectionRange(newCursor, newCursor);
      checkActiveFormats();
    }, 0);
  };

  const toggleBadge = (badgeText) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedText;
    const token = `**${badgeText}**`;

    if (start < end) {
      const sel = text.substring(start, end).trim();
      if (sel === token || sel === badgeText) {
        // Toggle OFF
        const newText = text.substring(0, start) + text.substring(end);
        setEditedText(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start);
          checkActiveFormats();
        }, 0);
        return;
      }
    }

    const replacement = `${token} `;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setEditedText(newText);
    setTimeout(() => {
      textarea.focus();
      const c = start + replacement.length;
      textarea.setSelectionRange(c, c);
      checkActiveFormats();
    }, 0);
  };

  const insertComplianceTable = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const tableTemplate =
      '\n\n| Clause No. | Tender Specification Parameter | Bidder Compliance Status | Verifiable Citation / Annexure Reference |\n| :--- | :--- | :---: | :--- |\n| **Cl 1.1** | Requirement parameter statement | **COMPLIED** | Audited Balance Sheets *(Annexure A-1)* |\n\n';
    const newText = editedText.substring(0, start) + tableTemplate + editedText.substring(start);
    setEditedText(newText);
    setTimeout(() => {
      textarea.focus();
      const c = start + tableTemplate.length;
      textarea.setSelectionRange(c, c);
      checkActiveFormats();
    }, 0);
  };

  const fmtBtnClass = (active) =>
    `p-1.5 rounded-lg border transition-all ${
      active
        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
        : 'text-slate-700 hover:bg-white hover:text-slate-900 border-transparent hover:border-slate-200'
    }`;

  const insertHorizontalRule = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const rule = '\n\n---\n\n';
    const newText = editedText.substring(0, start) + rule + editedText.substring(start);
    setEditedText(newText);
    setTimeout(() => {
      textarea.focus();
      const c = start + rule.length;
      textarea.setSelectionRange(c, c);
      checkActiveFormats();
    }, 0);
  };

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
            disabled={generating || !selectedTenderId || isViewer}
            title={isViewer ? 'Read-only role: generation disabled' : undefined}
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
                    disabled={saving || isViewer}
                    title={isViewer ? 'Read-only role: saving disabled' : 'Save Draft'}
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

              {/* View Mode Switcher & Live Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80">
                <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all btn-tactile ${
                      viewMode === 'split'
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Split View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('editor')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all btn-tactile ${
                      viewMode === 'editor'
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Editor Only</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all btn-tactile ${
                      viewMode === 'preview'
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Formatted Preview</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold">Live Synced</span>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px]">
                    {editedText.trim() ? editedText.trim().split(/\s+/).length : 0} words • ~{Math.max(1, Math.ceil((editedText.trim() ? editedText.trim().split(/\s+/).length : 0) / 220))} min read
                  </span>
                </div>
              </div>

              {/* Workspace Content: Split, Editor-Only, or Preview-Only */}
              <div
                className={`grid gap-4 ${
                  viewMode === 'split'
                    ? 'grid-cols-1 lg:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {/* Editor Pane */}
                {(viewMode === 'split' || viewMode === 'editor') && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-teal-600" />
                        <span>Human-in-the-Loop Markdown Editor</span>
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">{editedText.length} characters</span>
                    </div>

                    {/* Markdown Quick-Action Formatting Bar */}
                    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleInlineFormatting('bold')}
                        title="Bold (Ctrl+B, toggle)"
                        aria-pressed={activeFormats.bold}
                        className={fmtBtnClass(activeFormats.bold)}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleInlineFormatting('italic')}
                        title="Italic (Ctrl+I, toggle)"
                        aria-pressed={activeFormats.italic}
                        className={fmtBtnClass(activeFormats.italic)}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="h-4 w-px bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleLineFormatting('h2')}
                        title="Heading 2 (toggle)"
                        aria-pressed={activeFormats.h2}
                        className={fmtBtnClass(activeFormats.h2)}
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleLineFormatting('h3')}
                        title="Heading 3 (toggle)"
                        aria-pressed={activeFormats.h3}
                        className={fmtBtnClass(activeFormats.h3)}
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>
                      <span className="h-4 w-px bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleLineFormatting('bullet')}
                        title="Bullet List (toggle)"
                        aria-pressed={activeFormats.bullet}
                        className={fmtBtnClass(activeFormats.bullet)}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleLineFormatting('number')}
                        title="Numbered List (toggle)"
                        aria-pressed={activeFormats.number}
                        className={fmtBtnClass(activeFormats.number)}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertComplianceTable}
                        title="Insert Compliance Matrix Table"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200 text-[11px] font-medium"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                        <span>Table</span>
                      </button>
                      <span className="h-4 w-px bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleBadge('COMPLIED')}
                        title="Insert Complied Badge"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>COMPLIED</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleBadge('EXEMPTED')}
                        title="Insert Exempted Badge"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold hover:bg-blue-100 transition-colors"
                      >
                        <span>EXEMPTED</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleLineFormatting('quote')}
                        title="Blockquote (toggle)"
                        aria-pressed={activeFormats.quote}
                        className={fmtBtnClass(activeFormats.quote)}
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertHorizontalRule}
                        title="Horizontal Rule"
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onSelect={checkActiveFormats}
                      onKeyUp={checkActiveFormats}
                      onClick={checkActiveFormats}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                          e.preventDefault();
                          toggleInlineFormatting('bold');
                        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                          e.preventDefault();
                          toggleInlineFormatting('italic');
                        }
                      }}
                      readOnly={isViewer}
                      rows={22}
                      className="w-full p-4 bg-slate-50/70 border border-slate-300 rounded-2xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 leading-relaxed resize-none shadow-inner transition-colors"
                      placeholder="Type or edit proposal markdown..."
                    />
                  </div>
                )}

                {/* Live Formatted Preview Pane */}
                {(viewMode === 'split' || viewMode === 'preview') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          <span>Live Formatted Preview</span>
                        </p>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          GFR 2017 & GeM Layout
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setFontSize('normal')}
                            className={`px-2 py-0.5 rounded ${
                              fontSize === 'normal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => setFontSize('large')}
                            className={`px-2 py-0.5 rounded ${
                              fontSize === 'large' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            A+
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Open Fullscreen Print Package"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Expand</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={`h-[565px] overflow-y-auto p-5 bg-white border border-slate-200 rounded-2xl ${
                        fontSize === 'large' ? 'text-sm' : 'text-xs'
                      } text-slate-800 leading-relaxed shadow-2xs select-text`}
                    >
                      <MarkdownViewer content={editedText} />
                    </div>
                  </div>
                )}
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

              {/* Formatted Bid Content via MarkdownViewer */}
              <div className="border-t border-b border-slate-200 py-6 font-sans">
                <MarkdownViewer content={editedText} />
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
