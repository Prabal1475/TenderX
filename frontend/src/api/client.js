const API_BASE = '/api/v1';

export function getAuthToken() {
  return localStorage.getItem('tenderx_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('tenderx_token', token);
  } else {
    localStorage.removeItem('tenderx_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type for FormData (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new Event('auth-logout'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email, password, full_name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),
  getMe: () => request('/auth/me'),

  // Company Profile
  getCompanyProfile: () => request('/company/profile'),
  updateCompanyProfile: (data) =>
    request('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tenders
  listTenders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tenders/?${query}`);
  },
  getTender: (id) => request(`/tenders/${id}`),
  ingestTenders: (portal = 'GeM', generateMock = false) =>
    request(`/tenders/ingest?portal=${portal}&generate_mock=${generateMock}`, {
      method: 'POST',
    }),
  updateTenderStatus: (id, status) =>
    request(`/tenders/${id}/status?status=${status}`, {
      method: 'PATCH',
    }),

  // Matching
  evaluateTender: (tenderId) => request(`/matching/evaluate/${tenderId}`),
  getTopRecommendations: () => request('/matching/top-recommendations'),

  // Document Vault
  listDocuments: (category) => {
    const q = category ? `?category=${category}` : '';
    return request(`/documents/${q}`);
  },
  uploadDocument: (formData) =>
    request('/documents/upload', {
      method: 'POST',
      body: formData,
    }),
  semanticSearch: (query, category, top_k = 5) =>
    request('/documents/semantic-search', {
      method: 'POST',
      body: JSON.stringify({ query, category, top_k }),
    }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, {
      method: 'DELETE',
    }),

  // Bid Studio
  listBidDocuments: (tenderId) => request(`/bid-studio/tender/${tenderId}`),
  getBidDocument: (id) => request(`/bid-studio/${id}`),
  generateBidDocument: (tenderId, docType, customInstructions) =>
    request('/bid-studio/generate', {
      method: 'POST',
      body: JSON.stringify({
        tender_id: tenderId,
        doc_type: docType,
        custom_instructions: customInstructions,
      }),
    }),
  updateBidDocument: (id, data) =>
    request(`/bid-studio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tasks
  listTasks: (tenderId) => {
    const q = tenderId ? `?tender_id=${tenderId}` : '';
    return request(`/tasks/${q}`);
  },
  createTask: (data) =>
    request('/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id, data) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};
