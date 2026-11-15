import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { can, getRole, ROLE_LABELS, ROLE_BADGE_CLASSES } from '../utils/rbac';

const MATRIX_ROWS = [
  { key: 'view', label: 'View tenders, evaluations, vault & drafts', roles: ['admin', 'bid_manager', 'viewer'] },
  { key: 'edit_company_profile', label: 'Edit company profile', roles: ['admin', 'bid_manager'] },
  { key: 'upload_documents', label: 'Upload / analyze vault documents', roles: ['admin', 'bid_manager'] },
  { key: 'generate_bids', label: 'Generate & edit bids in Bid Studio', roles: ['admin', 'bid_manager'] },
  { key: 'manage_tasks', label: 'Create & update tasks', roles: ['admin', 'bid_manager'] },
  { key: 'delete', label: 'Delete documents & tasks', roles: ['admin'] },
  { key: 'manage_users', label: 'Manage users & roles', roles: ['admin'] },
];
const ROLES = ['admin', 'bid_manager', 'viewer'];

export default function TeamAccessPage({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = can(user, 'manage_users');

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (u, role) => {
    try {
      const updated = await api.updateUserRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
      toast.success(`${u.full_name || u.email} is now ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(err.message || 'Role update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" /> Team & Access Control
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Role-based access control. Your role:{' '}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${ROLE_BADGE_CLASSES[getRole(user)]}`}>
            {ROLE_LABELS[getRole(user)]}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-slate-800">Workspace Members</div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left px-5 py-2">Name</th>
                <th className="text-left px-5 py-2">Email</th>
                <th className="text-left px-5 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const r = getRole(u);
                const isSelf = u.id === user?.id || u.email === user?.email;
                return (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.full_name || '—'}{isSelf && <span className="ml-2 text-[10px] text-slate-400">(you)</span>}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3">
                      {isAdmin && !isSelf ? (
                        <select
                          value={r}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-teal-600"
                        >
                          {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${ROLE_BADGE_CLASSES[r]}`}>{ROLE_LABELS[r]}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isAdmin && (
          <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">Only Administrators can change roles.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" /> Permission Matrix
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left px-5 py-2">Capability</th>
              {ROLES.map((r) => <th key={r} className="px-5 py-2 text-center">{ROLE_LABELS[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-slate-100">
                <td className="px-5 py-2.5 text-slate-700">{row.label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-5 py-2.5 text-center">
                    {row.roles.includes(r)
                      ? <Check className="w-4 h-4 text-emerald-600 inline" />
                      : <X className="w-4 h-4 text-slate-300 inline" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
