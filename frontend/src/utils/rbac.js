// Client-side RBAC permission matrix (mirrors backend/app/api/deps.py enforcement).
// UI gating only — the backend is the source of truth and enforces every write.

export const ROLE_LABELS = {
  admin: 'Administrator',
  bid_manager: 'Bid Manager',
  viewer: 'Auditor / Viewer',
};

export const ROLE_BADGE_CLASSES = {
  admin: 'bg-violet-50 text-violet-800 border-violet-200',
  bid_manager: 'bg-teal-50 text-teal-800 border-teal-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-300',
};

const PERMISSIONS = {
  admin: [
    'manage_users', 'edit_company_profile', 'upload_documents', 'delete_documents',
    'generate_bids', 'edit_bids', 'export_packages', 'manage_tasks', 'delete_tasks',
  ],
  bid_manager: [
    'edit_company_profile', 'upload_documents', 'generate_bids', 'edit_bids',
    'export_packages', 'manage_tasks',
  ],
  viewer: [],
};

export function getRole(user) {
  if (!user) return 'viewer';
  if (user.role) return user.role;
  return user.is_superuser ? 'admin' : 'bid_manager';
}

export function can(user, permission) {
  return (PERMISSIONS[getRole(user)] || []).includes(permission);
}
