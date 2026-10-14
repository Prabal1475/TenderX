import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Mail, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken } from '../api/client';
import { useDemo } from '../demo/DemoContext';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@tenderx.local');
  const [password, setPassword] = useState('AdminPassword123!');
  const [fullName, setFullName] = useState('Prabal Singh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enableDemoMode } = useDemo();

  const handleLaunchDemo = () => {
    enableDemoMode('scenario_1');
    onLoginSuccess();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await api.register(email, password, fullName);
      }
      const data = await api.login(email, password);
      setAuthToken(data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials or use Demo Mode.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillAdmin = () => {
    setEmail('admin@tenderx.local');
    setPassword('AdminPassword123!');
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/60 via-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-md shadow-teal-700/15 mb-3">
            <Shield className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Create Platform Account' : 'Welcome to TenderX'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            AI-Powered Tender Intelligence & Proposal Engine for GeM and CPPP
          </p>
        </div>

        {/* Investor Demo Mode Feature Card */}
        <div className="mb-5 p-5 rounded-3xl bg-white border border-teal-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
              VC Showcase & Investor Demo
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
              Zero-Friction
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Explore with pre-seeded Indian Enterprise persona: <strong>Apex Enterprise Solutions Pvt Ltd</strong> (₹6.5 Cr turnover, MSME Micro, Railway credential certs).
          </p>

          <div className="flex flex-wrap gap-2 mb-4 text-[10px] text-slate-600">
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GeM 94% Match Scenario
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RAG Proposal Citations
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GFR 170 EMD Exemption
            </span>
          </div>

          <button
            type="button"
            onClick={handleLaunchDemo}
            className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-teal-600 hover:bg-teal-700 text-white btn-tactile active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all"
          >
            <span>Launch Investor Demo Mode</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Standard Sign-in / Register Card */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/90">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In with Account
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 btn-tactile active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register & Setup Profile' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-teal-700 hover:text-teal-900 hover:underline font-semibold text-[11px]"
            >
              {isRegister ? 'Already registered? Sign in' : 'New organization? Register'}
            </button>

            <button
              type="button"
              onClick={handlePrefillAdmin}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-medium"
            >
              Fill Default Seed Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
