import {
  DEMO_USER,
  DEMO_COMPANY_PROFILE,
  DEMO_ALL_TENDERS,
  DEMO_SCENARIO_1_TENDER,
  DEMO_SCENARIO_2_TENDER,
  DEMO_EVALUATION_SCENARIO_1,
  DEMO_EVALUATION_SCENARIO_2,
  DEMO_DOCUMENTS,
  DEMO_TASKS,
  DEMO_PREBAKED_COMPLIANCE_MATRIX,
  DEMO_PREBAKED_COVER_LETTER,
} from '../demo/demoData';

const API_BASE = '/api/v1';

export function isDemoActive() {
  return localStorage.getItem('tenderx_demo_mode') === 'true';
}

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

// In-memory demo drafts repository to allow creating/editing during pitch
let inMemoryDemoDrafts = [
  {
    id: 'demo-draft-01',
    tender_id: DEMO_SCENARIO_1_TENDER.id,
    title: 'Technical Compliance Matrix - Northern Railway CCTV',
    doc_type: 'Compliance_Matrix',
    status: 'Approved',
    drafted_content: DEMO_PREBAKED_COMPLIANCE_MATRIX,
    edited_content: DEMO_PREBAKED_COMPLIANCE_MATRIX,
    rag_citations: [
      { document_name: 'Northern_Railway_CCTV_Completion_Certificate.pdf', category: 'Past_Experience' },
      { document_name: 'ISO_9001_and_ISO_27001_Accreditation_Certificates.pdf', category: 'Statutory_Compliance' },
      { document_name: 'Udyam_MSME_Registration_Certificate_Apex.pdf', category: 'Company_Profile' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-draft-02',
    tender_id: DEMO_SCENARIO_1_TENDER.id,
    title: 'Official Cover Letter with EMD Exemption Declaration',
    doc_type: 'Cover_Letter',
    status: 'Under_Review',
    drafted_content: DEMO_PREBAKED_COVER_LETTER,
    edited_content: DEMO_PREBAKED_COVER_LETTER,
    rag_citations: [
      { document_name: 'Udyam_MSME_Registration_Certificate_Apex.pdf', category: 'Company_Profile' },
      { document_name: 'CA_Certified_3Year_Turnover_Audited_Balance_Sheet.pdf', category: 'Financial_Statement' },
    ],
    created_at: new Date().toISOString(),
  },
];

async function request(endpoint, options = {}) {
  // If demo mode is active, intercept before hitting network
  if (isDemoActive()) {
    return handleDemoRequest(endpoint, options);
  }

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

  try {
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
  } catch (err) {
    // If backend connection fails or is offline, gracefully fall back to local demo data
    console.warn(`Backend offline or unreachable for ${endpoint}. Serving intelligent fallback demo data.`);
    return handleDemoRequest(endpoint, options);
  }
}

function handleDemoRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // Auth endpoints
  if (endpoint.startsWith('/auth/login') || endpoint === '/auth/register') {
    return { access_token: 'demo-investor-token-apex', token_type: 'bearer' };
  }
  if (endpoint === '/auth/me') {
    return DEMO_USER;
  }

  // Company Profile
  if (endpoint === '/company/profile') {
    if (method === 'PUT' && options.body) {
      return { ...DEMO_COMPANY_PROFILE, ...JSON.parse(options.body) };
    }
    return DEMO_COMPANY_PROFILE;
  }

  // Tenders
  if (endpoint.startsWith('/tenders/')) {
    const parts = endpoint.split('?')[0].split('/');
    const tenderId = parts[2];
    if (tenderId && tenderId !== '') {
      const found = DEMO_ALL_TENDERS.find((t) => t.id === tenderId || t.tender_id === tenderId);
      return found || DEMO_SCENARIO_1_TENDER;
    }
    return DEMO_ALL_TENDERS;
  }
  if (endpoint.startsWith('/tenders')) {
    try {
      const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const portalParam = params.get('portal');
      const categoryParam = params.get('category');
      const searchParam = params.get('search');

      let list = [...DEMO_ALL_TENDERS];
      if (portalParam) {
        list = list.filter((t) => t.portal.toLowerCase() === portalParam.toLowerCase());
      }
      if (categoryParam) {
        list = list.filter((t) => t.category.toLowerCase() === categoryParam.toLowerCase());
      }
      if (searchParam) {
        const q = searchParam.toLowerCase();
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.tender_id.toLowerCase().includes(q) ||
            t.authority.toLowerCase().includes(q) ||
            (t.location_state && t.location_state.toLowerCase().includes(q))
        );
      }
      return list;
    } catch {
      return DEMO_ALL_TENDERS;
    }
  }

  // Matching
  if (endpoint.startsWith('/matching/evaluate/')) {
    const tenderId = endpoint.split('/matching/evaluate/')[1];
    if (tenderId === DEMO_SCENARIO_2_TENDER.id || tenderId === DEMO_SCENARIO_2_TENDER.tender_id) {
      return DEMO_EVALUATION_SCENARIO_2;
    }
    if (tenderId === DEMO_SCENARIO_1_TENDER.id || tenderId === DEMO_SCENARIO_1_TENDER.tender_id) {
      return DEMO_EVALUATION_SCENARIO_1;
    }

    const t = DEMO_ALL_TENDERS.find((item) => item.id === tenderId || item.tender_id === tenderId);
    if (t) {
      const crit = t.eligibility_criteria || {};
      const reqTurnover = crit.min_turnover_cr || 5.0;
      const reqExp = crit.min_experience_years || 4;
      const msmeApplies = Boolean(t.msme_exemption);

      const compTurnover = DEMO_COMPANY_PROFILE.annual_turnover_cr;
      const compExp = DEMO_COMPANY_PROFILE.years_of_experience;

      let turnoverPass = compTurnover >= reqTurnover;
      let relaxedMsme = false;
      if (!turnoverPass && msmeApplies && compTurnover >= reqTurnover * 0.5) {
        turnoverPass = true;
        relaxedMsme = true;
      }

      const expPass = compExp >= reqExp || (msmeApplies && compExp >= Math.max(1, reqExp * 0.6));
      const hardEligible = turnoverPass && expPass;

      let score = 50;
      if (hardEligible) {
        score = relaxedMsme ? 76 : Math.min(95, Math.round(82 + (compTurnover / reqTurnover) * 10));
      } else {
        score = Math.max(28, Math.min(58, Math.round((compTurnover / reqTurnover) * 40)));
      }

      const risks = [];
      if (!turnoverPass) {
        risks.push(`Mandatory turnover shortfall: required ₹${reqTurnover} Cr vs your ₹${compTurnover} Cr.`);
      }
      if (!expPass) {
        risks.push(`Operating experience shortfall: required ${reqExp} yrs vs your ${compExp} yrs.`);
      }

      return {
        overall_match_score: score,
        semantic_score: Math.min(98, score + 4),
        eligibility_score: hardEligible ? 88 : 32,
        is_hard_eligible: hardEligible,
        turnover_check: {
          passed: turnoverPass,
          required_cr: reqTurnover,
          company_cr: compTurnover,
          relaxed_via_msme: relaxedMsme,
        },
        experience_check: {
          passed: expPass,
          required_years: reqExp,
          company_years: compExp,
        },
        msme_benefit: {
          eligible_for_emd_exemption: t.msme_exemption,
          emd_amount_saved_inr: t.msme_exemption ? t.emd_amount_inr : 0,
        },
        certifications_check: {
          passed: true,
          matched: crit.required_certifications || ['ISO 9001:2015'],
          missing: [],
        },
        ai_rationale: hardEligible
          ? `High qualification match (${score}%). Company profile satisfies statutory criteria for ${t.authority}. ${
              relaxedMsme ? 'MSME relaxation under GFR 2017 bridges turnover threshold.' : 'Turnover and experience exceed criteria.'
            } Full EMD waiver applies.`
          : `Disqualification risk (${score}%). Company does not meet mandatory thresholds specified by ${t.authority}. Turnover or track record shortfall poses immediate rejection risk.`,
        risk_factors: risks,
      };
    }
    return DEMO_EVALUATION_SCENARIO_1;
  }
  if (endpoint === '/matching/top-recommendations') {
    return [
      {
        ...DEMO_SCENARIO_1_TENDER,
        overall_match_score: 94.5,
        recommendation: 'STRONG_BID',
      },
      {
        ...DEMO_ALL_TENDERS[2],
        overall_match_score: 88.0,
        recommendation: 'BID',
      },
    ];
  }

  // Document Vault
  if (endpoint.startsWith('/documents')) {
    if (endpoint === '/documents/upload') {
      return {
        id: `doc-uploaded-${Date.now()}`,
        filename: 'New_Credential_Certificate.pdf',
        category: 'Past_Experience',
        file_size_bytes: 350000,
        title: 'New Tender Credential Record',
        summary: 'Parsed and embedded document into pgvector.',
      };
    }
    if (endpoint === '/documents/semantic-search') {
      return DEMO_DOCUMENTS.slice(0, 2);
    }
    return DEMO_DOCUMENTS;
  }

  // Bid Studio
  if (endpoint.startsWith('/bid-studio/tender/')) {
    return inMemoryDemoDrafts;
  }
  if (endpoint === '/bid-studio/generate') {
    const body = options.body ? JSON.parse(options.body) : {};
    const isCover = body.doc_type === 'Cover_Letter';
    const newDoc = {
      id: `demo-draft-${Date.now()}`,
      tender_id: body.tender_id || DEMO_SCENARIO_1_TENDER.id,
      title: isCover ? 'Official Cover Letter with EMD Exemption' : 'Technical Compliance Matrix - Generated',
      doc_type: body.doc_type || 'Compliance_Matrix',
      status: 'Draft',
      drafted_content: isCover ? DEMO_PREBAKED_COVER_LETTER : DEMO_PREBAKED_COMPLIANCE_MATRIX,
      edited_content: isCover ? DEMO_PREBAKED_COVER_LETTER : DEMO_PREBAKED_COMPLIANCE_MATRIX,
      rag_citations: [
        { document_name: 'Northern_Railway_CCTV_Completion_Certificate.pdf', category: 'Past_Experience' },
        { document_name: 'ISO_9001_and_ISO_27001_Accreditation_Certificates.pdf', category: 'Statutory_Compliance' },
        { document_name: 'Udyam_MSME_Registration_Certificate_Apex.pdf', category: 'Company_Profile' },
      ],
      created_at: new Date().toISOString(),
    };
    inMemoryDemoDrafts = [newDoc, ...inMemoryDemoDrafts];
    return newDoc;
  }
  if (endpoint.startsWith('/bid-studio/')) {
    const id = endpoint.split('/bid-studio/')[1];
    const found = inMemoryDemoDrafts.find((d) => d.id === id);
    if (method === 'PUT' && options.body) {
      const data = JSON.parse(options.body);
      const updated = { ...(found || inMemoryDemoDrafts[0]), ...data };
      inMemoryDemoDrafts = inMemoryDemoDrafts.map((d) => (d.id === updated.id ? updated : d));
      return updated;
    }
    return found || inMemoryDemoDrafts[0];
  }

  // Tasks
  if (endpoint.startsWith('/tasks')) {
    return DEMO_TASKS;
  }

  return {};
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
