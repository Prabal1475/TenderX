import React, { useEffect, useState } from 'react';
import { Building2, Save, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState({
    company_name: '',
    pan_number: '',
    gst_number: '',
    udyam_msme_number: '',
    is_msme: 'Micro',
    annual_turnover_cr: 5.0,
    net_worth_cr: 2.0,
    years_of_experience: 5,
    sectors: [],
    certifications: [],
    key_clients: [],
    core_competencies: '',
  });

  const [sectorsStr, setSectorsStr] = useState('');
  const [certsStr, setCertsStr] = useState('');
  const [clientsStr, setClientsStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getCompanyProfile();
        setProfile(data);
        setSectorsStr((data.sectors || []).join(', '));
        setCertsStr((data.certifications || []).join(', '));
        setClientsStr((data.key_clients || []).join(', '));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      ...profile,
      annual_turnover_cr: parseFloat(profile.annual_turnover_cr),
      net_worth_cr: parseFloat(profile.net_worth_cr),
      years_of_experience: parseInt(profile.years_of_experience),
      sectors: sectorsStr.split(',').map((s) => s.trim()).filter(Boolean),
      certifications: certsStr.split(',').map((s) => s.trim()).filter(Boolean),
      key_clients: clientsStr.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const updatePromise = api.updateCompanyProfile(payload).then((updated) => {
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      return updated;
    });

    toast.promise(updatePromise, {
      loading: 'Updating company profile & generating pgvector embeddings...',
      success: 'Company credentials & qualification profile saved!',
      error: (err) => `Update failed: ${err.message}`,
    });

    try {
      await updatePromise;
    } catch {
      // Handled by toast
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-cascade">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded skeleton" />
          <div className="h-4 w-96 rounded skeleton" />
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-cascade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Company Qualification Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Indian statutory details, turnover credentials, and core competencies used by the AI Matching and RAG Engine
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-cascade">
            <CheckCircle className="w-4 h-4" />
            <span>Profile & Embeddings Updated!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl space-y-6">
        {/* Statutory Identifiers */}
        <div>
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Statutory Registration & Tax IDs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Legal Name</label>
              <input
                type="text"
                required
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">MSME Classification</label>
              <select
                value={profile.is_msme || 'Micro'}
                onChange={(e) => setProfile({ ...profile, is_msme: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="Micro">Micro Enterprise</option>
                <option value="Small">Small Enterprise</option>
                <option value="Medium">Medium Enterprise</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">PAN Number</label>
              <input
                type="text"
                value={profile.pan_number || ''}
                onChange={(e) => setProfile({ ...profile, pan_number: e.target.value })}
                placeholder="AAACR1234F"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">GSTIN Number</label>
              <input
                type="text"
                value={profile.gst_number || ''}
                onChange={(e) => setProfile({ ...profile, gst_number: e.target.value })}
                placeholder="07AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Udyam MSME Registration</label>
              <input
                type="text"
                value={profile.udyam_msme_number || ''}
                onChange={(e) => setProfile({ ...profile, udyam_msme_number: e.target.value })}
                placeholder="UDYAM-DL-01-0012345"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Financial & Track Record */}
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Financial Turnover & Track Record Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Avg. Annual Turnover (₹ Crores)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={profile.annual_turnover_cr}
                onChange={(e) => setProfile({ ...profile, annual_turnover_cr: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Net Worth (₹ Crores)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={profile.net_worth_cr}
                onChange={(e) => setProfile({ ...profile, net_worth_cr: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Years of Operating Experience
              </label>
              <input
                type="number"
                required
                value={profile.years_of_experience}
                onChange={(e) => setProfile({ ...profile, years_of_experience: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Capabilities, Sectors & Narrative */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Capabilities & RAG Vector Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Sectors / Domain Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={sectorsStr}
                onChange={(e) => setSectorsStr(e.target.value)}
                placeholder="IT Infrastructure, CCTV Surveillance, Cloud Services, Solar Power"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Certifications & Standards (Comma Separated)
              </label>
              <input
                type="text"
                value={certsStr}
                onChange={(e) => setCertsStr(e.target.value)}
                placeholder="ISO 9001:2015, ISO 27001, CMMI Level 3, BIS"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Key PSU / Government Clients (Comma Separated)
              </label>
              <input
                type="text"
                value={clientsStr}
                onChange={(e) => setClientsStr(e.target.value)}
                placeholder="Northern Railway, AIIMS New Delhi, BSNL, IOCL"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Core Technical Capabilities & Specialization Narrative</span>
                <span className="text-[10px] text-teal-400 font-normal">Indexed into semantic vector profile</span>
              </label>
              <textarea
                rows={4}
                value={profile.core_competencies || ''}
                onChange={(e) => setProfile({ ...profile, core_competencies: e.target.value })}
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 leading-relaxed"
                placeholder="Describe your engineering strengths, delivered past projects, and turnkey execution specializations..."
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating & Vectorizing...' : 'Save Profile & Re-Index AI'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
