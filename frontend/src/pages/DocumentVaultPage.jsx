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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Company Document & Credential Vault
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Securely store certificates, balance sheets, past contracts, and search them via pgvector semantic embeddings
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20"
        >
          <UploadCloud className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Semantic Search Inspector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Semantic Vault Query Tester</h2>
        </div>
        <p className="text-xs text-slate-600">
          Query your credential repository in natural language. The system searches across 384-dimensional pgvector embeddings.
        </p>

        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. CCTV installation experience in railways, ISO 27001 cybersecurity certification, or past PSU clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold rounded-xl text-xs border border-slate-200 btn-tactile active:scale-[0.97] disabled:opacity-50"
          >
            {searching ? 'Querying...' : 'Semantic Query'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 animate-cascade">
            <p className="text-[11px] font-semibold text-slate-500">
              Top Retrieved Semantic Chunks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((chunk, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-teal-200 text-xs space-y-1.5 animate-cascade shadow-xs"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-teal-800 font-bold">{chunk.document_name}</span>
                    <span className="px-2 py-0.5 rounded bg-teal-100/70 text-teal-800 font-bold border border-teal-200">
                      {(chunk.similarity_score * 100).toFixed(0)}% Match
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

      {/* Document Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Indexed Credentials & Certificates</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
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
          <div className="text-center py-16 text-slate-500 text-xs">
            No credential documents uploaded yet. Upload your past work completion certificates, MSME registration, or audit reports.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors animate-cascade"
                style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{doc.title || doc.filename}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {doc.category.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
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
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 btn-tactile active:scale-[0.92]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-overlay-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-in relative">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Upload Credential Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 btn-tactile active:scale-[0.92]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Uploaded files are parsed, chunked, and vectorized for automated proposal drafting and compliance matching.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Northern Railway CCTV Completion Certificate 2024"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select File (PDF, DOCX, TXT)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 file:btn-tactile file:cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 btn-tactile active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.97] shadow-sm shadow-teal-700/20 disabled:opacity-50"
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
