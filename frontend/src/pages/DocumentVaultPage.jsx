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
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatDate } from '../utils/formatters';

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
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form state
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Past_Experience');
  const [title, setTitle] = useState('');

  // Semantic Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await api.listDocuments();
      setDocuments(data);
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
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (title) formData.append('title', title);

    const uploadPromise = api.uploadDocument(formData).then(async () => {
      setShowUploadModal(false);
      setFile(null);
      setTitle('');
      await fetchDocs();
    });

    toast.promise(uploadPromise, {
      loading: 'Parsing, chunking, and indexing embeddings...',
      success: 'Document successfully indexed into credential vault!',
      error: (err) => `Upload failed: ${err.message}`,
    });

    try {
      await uploadPromise;
    } catch {
      // Handled by toast
    } finally {
      setUploading(false);
    }
  };

  const executeDelete = async (id) => {
    const deletePromise = api.deleteDocument(id).then(fetchDocs);
    toast.promise(deletePromise, {
      loading: 'Deleting document & clearing pgvector chunks...',
      success: 'Document purged from credential vault',
      error: (err) => `Deletion failed: ${err.message}`,
    });
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
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.semanticSearch(searchQuery, null, 4);
      setSearchResults(res);
      if (res.length > 0) {
        toast.success(`Found ${res.length} relevant semantic matches`);
      } else {
        toast('No direct semantic matches found in vault');
      }
    } catch (err) {
      toast.error(`Semantic search error: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-cascade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Company Document & Credential Vault
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Securely store certificates, balance sheets, past contracts, and search them via pgvector semantic embeddings
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/20"
        >
          <UploadCloud className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Semantic Search Inspector */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-white">Semantic Vault Query Tester</h2>
        </div>
        <p className="text-xs text-slate-400">
          Query your credential repository in natural language. The system searches across 384-dimensional pgvector embeddings.
        </p>

        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. CCTV installation experience in railways, ISO 27001 cybersecurity certification, or past PSU clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold rounded-xl text-xs border border-slate-700 btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            {searching ? 'Querying...' : 'Semantic Query'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 animate-cascade">
            <p className="text-[11px] font-semibold text-slate-400">
              Top Retrieved Semantic Chunks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((chunk, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs space-y-1.5 animate-cascade"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-teal-400 font-semibold">{chunk.document_name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                      {(chunk.similarity_score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Records Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-white">Indexed Credentials & Certificates</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {documents.length} Files In Vault
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-48 rounded skeleton" />
                    <div className="h-3 w-32 rounded skeleton" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded skeleton" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No credential documents uploaded yet. Upload your past work completion certificates, MSME registration, or audit reports.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors animate-cascade"
                style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{doc.title || doc.filename}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-medium">
                        {doc.category.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {doc.chunks_count || 1} pgvector chunks
                      </span>
                      <span>•</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePrompt(doc)}
                  title="Delete Document"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 btn-tactile active:scale-[0.92]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal with Emil's modal physics */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-overlay-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4 animate-modal-in relative">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Upload Credential Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 btn-tactile active:scale-[0.92]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Uploaded files are parsed, chunked, and vectorized for automated proposal drafting and compliance matching.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Northern Railway CCTV Completion Certificate 2024"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select File (PDF, DOCX, TXT)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-500 file:text-slate-950 hover:file:bg-teal-400 file:btn-tactile file:cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 btn-tactile active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {uploading ? 'Parsing & Indexing...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
