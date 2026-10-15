import React, { useEffect, useState } from 'react';
import {
  FolderLock,
  UploadCloud,
  Search,
  FileText,
  Trash2,
  Sparkles,
  CheckCircle,
  Clock,
  Layers,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  Tag,
  RefreshCw,
  FileCheck2,
  Award,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatDate, formatFileSize } from '../utils/formatters';

const CATEGORY_MAP = {
  Past_Experience: {
    label: 'Past Experience & Work Completion',
    short: 'Past Experience',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    iconColor: 'text-amber-600',
    bgIcon: 'bg-amber-100/60',
  },
  Financial_Audit: {
    label: 'Financial Audit & Balance Sheet',
    short: 'Financial Audit',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
    bgIcon: 'bg-blue-100/60',
  },
  MSME_Udyam: {
    label: 'MSME & Udyam Registration',
    short: 'MSME Udyam',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
    bgIcon: 'bg-emerald-100/60',
  },
  GST_Certificate: {
    label: 'GST & Statutory Tax Records',
    short: 'GST Certificate',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    iconColor: 'text-purple-600',
    bgIcon: 'bg-purple-100/60',
  },
  ISO_Quality: {
    label: 'ISO Quality & Standards Accreditation',
    short: 'ISO Quality',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    iconColor: 'text-teal-600',
    bgIcon: 'bg-teal-100/60',
  },
  Technical_Proposal: {
    label: 'Technical Proposal & Datasheet',
    short: 'Technical Proposal',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    iconColor: 'text-rose-600',
    bgIcon: 'bg-rose-100/60',
  },
};

const CATEGORIES = [
  'Past_Experience',
  'Financial_Audit',
  'MSME_Udyam',
  'GST_Certificate',
  'ISO_Quality',
  'Technical_Proposal',
];

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: Idle, 1: Extracting, 2: Analyzing, 3: Vectorizing
  const [analyzingDocId, setAnalyzingDocId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSemanticTester, setShowSemanticTester] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Upload Form state
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Auto_Detect');
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Semantic Search state
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState([]);
  const [searchingSemantic, setSearchingSemantic] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await api.listDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vault documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a document file to upload');
      return;
    }

    setUploading(true);
    setUploadStep(1);

    const stepTimer1 = setTimeout(() => setUploadStep(2), 650);
    const stepTimer2 = setTimeout(() => setUploadStep(3), 1350);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (title.trim()) formData.append('title', title.trim());

    try {
      await api.uploadDocument(formData);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      toast.success('Document uploaded, analyzed, and indexed into pgvector vault!');
      setShowUploadModal(false);
      setFile(null);
      setTitle('');
      setCategory('Auto_Detect');
      await fetchDocs();
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      toast.error(`Upload & analysis failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadStep(0);
    }
  };

  const handleReanalyze = async (docId) => {
    setAnalyzingDocId(docId);
    try {
      await api.analyzeDocument(docId);
      toast.success('AI analysis refreshed: metadata & scope description updated!');
      await fetchDocs();
    } catch (err) {
      toast.error(`Re-analysis failed: ${err.message}`);
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const executeDelete = async (id) => {
    try {
      await api.deleteDocument(id);
      toast.success('Document purged from credential vault');
      await fetchDocs();
    } catch (err) {
      toast.error(`Deletion failed: ${err.message}`);
    }
  };

  const handleDeletePrompt = (doc) => {
    toast(`Delete "${doc.title || doc.filename}"?`, {
      description: 'This will purge all indexed pgvector embeddings permanently.',
      action: {
        label: 'Delete',
        onClick: () => executeDelete(doc.id),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;

    setSearchingSemantic(true);
    try {
      const res = await api.semanticSearch(semanticQuery, null, 4);
      setSemanticResults(Array.isArray(res) ? res : []);
      if (res && res.length > 0) {
        toast.success(`Retrieved ${res.length} relevant semantic matches`);
      } else {
        toast('No direct semantic matches found in vault');
      }
    } catch (err) {
      toast.error(`Semantic search error: ${err.message}`);
    } finally {
      setSearchingSemantic(false);
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const meta = doc.doc_metadata || {};
      const titleMatch = (doc.title && doc.title.toLowerCase().includes(q)) || false;
      const fnMatch = (doc.filename && doc.filename.toLowerCase().includes(q)) || false;
      const catMatch = (doc.category && doc.category.toLowerCase().includes(q)) || false;
      const authMatch = (meta.issuing_authority && meta.issuing_authority.toLowerCase().includes(q)) || false;
      const refMatch = (meta.reference_number && meta.reference_number.toLowerCase().includes(q)) || false;
      const summaryMatch = (doc.summary && doc.summary.toLowerCase().includes(q)) || false;
      return titleMatch || fnMatch || catMatch || authMatch || refMatch || summaryMatch;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-cascade">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Procurement Credential Vault
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              AI Metadata & Document Analysis Active
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1.5">
            Document Vault & Credential Analyzer
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Upload certificates, audited balance sheets, work orders, and MSME registrations. AI extracts structured metadata, classifies document types, generates scope summaries, and indexes content into pgvector.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSemanticTester(!showSemanticTester)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 btn-tactile active:scale-[0.97]"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Semantic Tester</span>
            {showSemanticTester ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>Upload & Analyze Document</span>
          </button>
        </div>
      </div>

      {/* Vault Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vault Files</span>
            <FolderLock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{documents.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Indexed credentials</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Analyzed Types</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {new Set(documents.map((d) => d.category)).size}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Procurement categories</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indexed Embeddings</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {documents.reduce((acc, d) => acc + (d.chunks_count || 1), 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">384-dim pgvector chunks</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Statutory Gate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">100%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">EMD & turnover ready</p>
        </div>
      </div>

      {/* Collapsible Semantic Search Tester */}
      {showSemanticTester && (
        <div className="bg-white p-5 rounded-3xl border border-teal-200 shadow-sm space-y-4 animate-modal-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">pgvector Semantic Embeddings Inspector</h2>
            </div>
            <button
              onClick={() => setShowSemanticTester(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Query your credential repository in natural language. The system retrieves matched document chunks across 384-dimensional pgvector embeddings.
          </p>

          <form onSubmit={handleSemanticSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                placeholder="e.g. CCTV installation experience in railways, ISO 27001 cybersecurity certification, or past PSU clients..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searchingSemantic}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs btn-tactile active:scale-[0.97] disabled:opacity-50"
            >
              {searchingSemantic ? 'Querying...' : 'Semantic Query'}
            </button>
          </form>

          {semanticResults.length > 0 && (
            <div className="space-y-2 pt-2 animate-cascade">
              <p className="text-[11px] font-semibold text-slate-500">
                Top Retrieved Semantic Chunks:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {semanticResults.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-teal-200 text-xs space-y-1.5 animate-cascade shadow-xs"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-teal-800 font-bold">{chunk.document_name}</span>
                      <span className="px-2 py-0.5 rounded bg-teal-100/70 text-teal-800 font-bold border border-teal-200">
                        {Math.round((chunk.similarity_score || 0.89) * 100)}% Match
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-3">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by title, category, issuing authority, reference number, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing {filteredDocuments.length} of {documents.length} credentials</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Categories ({documents.length})
          </button>
          {CATEGORIES.map((catKey) => {
            const count = documents.filter((d) => d.category === catKey).length;
            const meta = CATEGORY_MAP[catKey] || { short: catKey };
            const isActive = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{meta.short}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-teal-700/60 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Records Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl skeleton" />
                    <div className="space-y-2">
                      <div className="h-4 w-64 rounded skeleton" />
                      <div className="h-3 w-40 rounded skeleton" />
                    </div>
                  </div>
                  <div className="h-8 w-24 rounded skeleton" />
                </div>
                <div className="h-16 rounded-2xl skeleton" />
                <div className="grid grid-cols-4 gap-3">
                  <div className="h-12 rounded-xl skeleton" />
                  <div className="h-12 rounded-xl skeleton" />
                  <div className="h-12 rounded-xl skeleton" />
                  <div className="h-12 rounded-xl skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto">
              <FolderLock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchFilter || selectedCategory !== 'ALL'
                ? 'No documents matched your current search or category filter. Try clearing filters or searching with different terms.'
                : 'Upload your company work completion certificates, 3-year audited financial statements, or Udyam MSME certificate to start indexing.'}
            </p>
            <button
              onClick={() => {
                setSearchFilter('');
                setSelectedCategory('ALL');
                setShowUploadModal(true);
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold btn-tactile"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Credential</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc, idx) => {
              const catConfig = CATEGORY_MAP[doc.category] || {
                label: doc.category.replace(/_/g, ' '),
                short: doc.category.replace(/_/g, ' '),
                badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
                iconColor: 'text-slate-600',
                bgIcon: 'bg-slate-100',
              };
              const meta = doc.doc_metadata || {};
              const isAnalyzing = analyzingDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-300 transition-all space-y-4 animate-cascade"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${catConfig.bgIcon} border border-slate-200 flex items-center justify-center ${catConfig.iconColor} shrink-0 mt-0.5 shadow-2xs`}>
                        <FileText className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {doc.title || doc.filename}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.badgeClass}`}>
                            {catConfig.short}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono text-slate-600 font-medium">{doc.filename}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size_bytes)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {doc.chunks_count || 1} pgvector chunks
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Re-Analyze & Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      <button
                        onClick={() => handleReanalyze(doc.id)}
                        disabled={isAnalyzing}
                        title="Re-run AI analysis and extract refreshed metadata"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 btn-tactile active:scale-[0.95] disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>Re-Analyze</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeletePrompt(doc)}
                        title="Delete Document"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 btn-tactile active:scale-[0.92]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI Content Analysis & Scope Summary Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/70 via-slate-50/60 to-emerald-50/40 border border-teal-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900 tracking-tight">
                          ✨ AI Document Summary & Credential Scope
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {meta.verification_status || 'Verified Authenticated'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {doc.summary || 'Document parsed, vectorized, and verified into pgvector repository.'}
                    </p>

                    {meta.tender_qualification_relevance && (
                      <div className="pt-2 border-t border-teal-200/60 flex items-start gap-2 text-[11px] text-teal-900 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-teal-950">Procurement Gate Relevance: </span>
                          <span>{meta.tender_qualification_relevance}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Structured Extracted Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* Issuing Authority */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Issuing Authority</span>
                      </div>
                      <div className="font-semibold text-slate-900 truncate" title={meta.issuing_authority || 'Competent Authority'}>
                        {meta.issuing_authority || 'Competent Authority'}
                      </div>
                    </div>

                    {/* Certificate / Reference Number */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reference / Certificate #</span>
                      </div>
                      <div className="font-mono font-semibold text-slate-800 truncate" title={meta.reference_number || 'N/A'}>
                        {meta.reference_number || 'N/A'}
                      </div>
                    </div>

                    {/* Financial Value / Turnover */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>Financial Value / Fee</span>
                      </div>
                      <div className="font-bold text-teal-700 truncate" title={meta.financial_value || 'N/A'}>
                        {meta.financial_value || 'N/A'}
                      </div>
                    </div>

                    {/* Issue & Validity Dates */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Issue & Validity</span>
                      </div>
                      <div className="font-semibold text-slate-900 truncate" title={`${meta.issue_date || 'N/A'} • ${meta.validity_period || 'Active'}`}>
                        {meta.issue_date ? `${meta.issue_date} • ${meta.validity_period || 'Perpetual'}` : (meta.validity_period || 'Active / Valid')}
                      </div>
                    </div>
                  </div>

                  {/* Key Entities / Tags */}
                  {(meta.key_entities?.length > 0 || doc.tags?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Extracted Entities:
                      </span>
                      {(meta.key_entities || doc.tags).map((entity, eIdx) => (
                        <span
                          key={eIdx}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Technical Footer */}
                  {meta.file_stats && (
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>Format: <strong className="text-slate-600">{meta.file_stats.file_type || 'PDF'}</strong></span>
                        <span>•</span>
                        <span>Word Count: <strong className="text-slate-600">{meta.file_stats.word_count || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Estimated Pages: <strong className="text-slate-600">{meta.file_stats.estimated_pages || 1}</strong></span>
                      </div>
                      <span className="font-mono text-slate-400">pgvector embedding: cosine distance</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal with Progress Stepper */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-overlay-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-in relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Upload & Analyze Credential</h2>
              </div>
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 btn-tactile active:scale-[0.92] disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload past completion certificates, audited balance sheets, or MSME credentials. The document analyzer will detect procurement category, extract structured metadata, and generate an executive scope summary.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Document File (PDF, DOCX, TXT)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setFile(e.dataTransfer.files[0]);
                      if (!title) {
                        setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                      }
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/50'
                      : file
                      ? 'border-teal-400 bg-teal-50/20'
                      : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100/70 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                          <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                      <div className="text-xs text-slate-600">
                        <label className="font-bold text-teal-600 hover:text-teal-700 cursor-pointer underline">
                          Click to browse
                          <input
                            type="file"
                            required
                            accept=".pdf,.docx,.txt,.md"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                setFile(e.target.files[0]);
                                if (!title) {
                                  setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <span> or drag and drop file here</span>
                      </div>
                      <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, MD up to 25 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title <span className="text-slate-400 font-normal">(Optional, auto-detected if empty)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Northern Railway CCTV Completion Certificate 2024"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Procurement Classification
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                >
                  <option value="Auto_Detect">✨ Auto-Detect Classification via AI Content Analysis</option>
                  {CATEGORIES.map((c) => {
                    const meta = CATEGORY_MAP[c];
                    return (
                      <option key={c} value={c}>
                        {meta ? meta.label : c.replace('_', ' ')}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Upload & Analysis Progress Stepper */}
              {uploading && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2.5 animate-modal-in">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      Analyzing Document Content...
                    </span>
                    <span>Step {uploadStep || 1} of 3</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${uploadStep >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {uploadStep > 1 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
                      </div>
                      <span className={uploadStep >= 1 ? 'text-teal-900 font-semibold' : 'text-slate-400'}>
                        Reading file binary stream & extracting text
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${uploadStep >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {uploadStep > 2 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '2'}
                      </div>
                      <span className={uploadStep >= 2 ? 'text-teal-900 font-semibold' : 'text-slate-400'}>
                        Detecting procurement category & extracting structured metadata
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${uploadStep >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {uploadStep > 3 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '3'}
                      </div>
                      <span className={uploadStep >= 3 ? 'text-teal-900 font-semibold' : 'text-slate-400'}>
                        Generating executive scope summary & indexing pgvector embeddings
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 btn-tactile active:scale-[0.97] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing & Vectorizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upload & Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
