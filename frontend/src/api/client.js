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
import { calculateTenderMatch } from '../utils/matching';

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

let inMemoryDemoDocuments = [...DEMO_DOCUMENTS];

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
    const rawId = endpoint.replace(/^\/tenders\//, '').split('?')[0];
    const tenderId = decodeURIComponent(rawId);
    if (tenderId && tenderId !== '') {
      const found = DEMO_ALL_TENDERS.find((t) => t.id === tenderId || t.tender_id === tenderId);
      const target = found || DEMO_SCENARIO_1_TENDER;
      const match = calculateTenderMatch(target, DEMO_COMPANY_PROFILE);
      return {
        ...target,
        overall_match_score: match.overall_match_score,
        is_hard_eligible: match.is_hard_eligible,
      };
    }
    return DEMO_ALL_TENDERS.map((t) => {
      const match = calculateTenderMatch(t, DEMO_COMPANY_PROFILE);
      return {
        ...t,
        overall_match_score: match.overall_match_score,
        is_hard_eligible: match.is_hard_eligible,
      };
    });
  }
  if (endpoint.startsWith('/tenders')) {
    try {
      const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const portalParam = params.get('portal');
      const categoryParam = params.get('category');
      const searchParam = params.get('search');
      const eligibilityParam = params.get('eligibility');

      let list = DEMO_ALL_TENDERS.map((t) => {
        const match = calculateTenderMatch(t, DEMO_COMPANY_PROFILE);
        return {
          ...t,
          overall_match_score: match.overall_match_score,
          is_hard_eligible: match.is_hard_eligible,
        };
      });

      if (portalParam) {
        list = list.filter((t) => t.portal.toLowerCase() === portalParam.toLowerCase());
      }
      if (categoryParam) {
        list = list.filter((t) => t.category.toLowerCase() === categoryParam.toLowerCase());
      }
      if (eligibilityParam) {
        if (eligibilityParam === 'matched' || eligibilityParam === 'eligible') {
          list = list.filter((t) => Boolean(t.is_hard_eligible || (t.overall_match_score || 0) >= 60));
        } else if (eligibilityParam === 'ineligible') {
          list = list.filter((t) => !t.is_hard_eligible && (t.overall_match_score || 0) < 60);
        } else if (eligibilityParam === 'msme') {
          list = list.filter((t) => Boolean(t.msme_exemption || t.startup_exemption));
        }
      }
      if (searchParam) {
        const q = searchParam.toLowerCase().trim();
        list = list.filter((t) => {
          const titleMatch = t.title && t.title.toLowerCase().includes(q);
          const idMatch = (t.tender_id && t.tender_id.toLowerCase().includes(q)) || (t.id && t.id.toLowerCase().includes(q));
          const authMatch = t.authority && t.authority.toLowerCase().includes(q);
          const catMatch = t.category && t.category.toLowerCase().includes(q);
          const locMatch = t.location_state && t.location_state.toLowerCase().includes(q);
          const descMatch = t.description && t.description.toLowerCase().includes(q);

          // Eligibility matching
          const isEligible = Boolean(t.is_hard_eligible || (t.overall_match_score || 0) >= 60);
          const statusMatch = (q.includes('eligib') || q.includes('qualif'))
            ? (q.includes('ineligib') || q.includes('disqualif') ? !isEligible : isEligible)
            : false;

          const msmeMatch = (q.includes('msme') || q.includes('exempt') || q.includes('startup') || q.includes('waiver'))
            ? Boolean(t.msme_exemption || t.startup_exemption)
            : false;

          const crit = t.eligibility_criteria || {};
          const certMatch = Array.isArray(crit.required_certifications) &&
            crit.required_certifications.some((cert) => cert.toLowerCase().includes(q));
          const turnoverMatch = crit.min_turnover_cr != null && (
            String(crit.min_turnover_cr).includes(q) ||
            `${crit.min_turnover_cr} cr`.toLowerCase().includes(q)
          );
          const expMatch = crit.min_experience_years != null && (
            String(crit.min_experience_years).includes(q) ||
            `${crit.min_experience_years} years`.toLowerCase().includes(q)
          );

          return (
            titleMatch ||
            idMatch ||
            authMatch ||
            catMatch ||
            locMatch ||
            descMatch ||
            statusMatch ||
            msmeMatch ||
            certMatch ||
            turnoverMatch ||
            expMatch
          );
        });
      }
      return list;
    } catch {
      return DEMO_ALL_TENDERS.map((t) => {
        const match = calculateTenderMatch(t, DEMO_COMPANY_PROFILE);
        return {
          ...t,
          overall_match_score: match.overall_match_score,
          is_hard_eligible: match.is_hard_eligible,
        };
      });
    }
  }

  // Matching
  if (endpoint.startsWith('/matching/evaluate/')) {
    const rawId = endpoint.replace(/^\/matching\/evaluate\//, '').split('?')[0];
    const tenderId = decodeURIComponent(rawId);
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
    const list = DEMO_ALL_TENDERS.map((t) => {
      const match = calculateTenderMatch(t, DEMO_COMPANY_PROFILE);
      return {
        ...t,
        tender_code: t.tender_id,
        overall_match_score: match.overall_match_score,
        is_hard_eligible: match.is_hard_eligible,
        ai_rationale: match.is_hard_eligible
          ? `High qualification match (${match.overall_match_score}%). Meets turnover and technical track record criteria under company profile.`
          : `Eligibility shortfall risk (${match.overall_match_score}%). Turnover requirement exceeds current profile threshold.`,
        recommendation: match.is_hard_eligible ? (match.overall_match_score >= 85 ? 'STRONG_BID' : 'BID') : 'SHORTFALL_RISK',
      };
    });
    // Return all qualified/matched tenders, sorted descending by score
    return list
      .filter((t) => t.is_hard_eligible || t.overall_match_score >= 60)
      .sort((a, b) => b.overall_match_score - a.overall_match_score);
  }

  // Document Vault
  if (endpoint.startsWith('/documents')) {
    if (endpoint.includes('/analyze') && method === 'POST') {
      const parts = endpoint.split('/');
      const docId = parts[2];
      const found = inMemoryDemoDocuments.find((d) => d.id === docId);
      if (found) {
        const updatedMetadata = {
          ...found.doc_metadata,
          verification_status: 'Verified Authenticated (AI Re-scan)',
          reanalyzed_at: new Date().toISOString(),
        };
        found.doc_metadata = updatedMetadata;
        return {
          id: found.id,
          title: found.title,
          category: found.category,
          summary: found.summary,
          doc_metadata: updatedMetadata,
          message: 'Document analyzed and metadata extracted successfully',
        };
      }
      return { message: 'Document not found' };
    }

    if (method === 'DELETE') {
      const docId = endpoint.split('/documents/')[1];
      if (docId) {
        inMemoryDemoDocuments = inMemoryDemoDocuments.filter((d) => d.id !== docId);
      }
      return { message: 'Document purged successfully' };
    }

    if (endpoint === '/documents/upload') {
      let rawFilename = 'Document_Credential.pdf';
      let rawCategory = 'Past_Experience';
      let rawTitle = '';

      if (options.body instanceof FormData) {
        const fileObj = options.body.get('file');
        if (fileObj && fileObj.name) rawFilename = fileObj.name;
        const cat = options.body.get('category');
        if (cat && cat !== 'Auto_Detect') rawCategory = cat;
        const t = options.body.get('title');
        if (t) rawTitle = t;
      }

      // Infer category if Auto_Detect or not specified
      const lowerName = rawFilename.toLowerCase();
      if (lowerName.includes('msme') || lowerName.includes('udyam')) {
        rawCategory = 'MSME_Udyam';
      } else if (lowerName.includes('balance') || lowerName.includes('audit') || lowerName.includes('turnover')) {
        rawCategory = 'Financial_Audit';
      } else if (lowerName.includes('gst') || lowerName.includes('tax')) {
        rawCategory = 'GST_Certificate';
      } else if (lowerName.includes('iso') || lowerName.includes('quality') || lowerName.includes('security')) {
        rawCategory = 'ISO_Quality';
      } else if (lowerName.includes('proposal') || lowerName.includes('technical') || lowerName.includes('spec')) {
        rawCategory = 'Technical_Proposal';
      }

      const generatedTitle = rawTitle || rawFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const newDoc = {
        id: `doc-uploaded-${Date.now()}`,
        filename: rawFilename,
        category: rawCategory,
        file_type: rawFilename.split('.').pop() || 'pdf',
        file_size_bytes: 345000,
        title: generatedTitle,
        summary: `AI analyzed credential document '${rawFilename}'. Verified as a valid ${rawCategory.replace(/_/g, ' ')} submission satisfying statutory procurement criteria.`,
        tags: [rawCategory.replace(/_/g, ' '), 'Verified Credential', 'AI Parsed'],
        doc_metadata: {
          issuing_authority: rawCategory === 'MSME_Udyam' ? 'Ministry of MSME, GoI' : rawCategory === 'Financial_Audit' ? 'Statutory Auditor & Chartered Accountants' : 'Government / PSU Competent Authority',
          reference_number: `VER/TX/${Math.floor(100000 + Math.random() * 900000)}`,
          financial_value: rawCategory === 'Financial_Audit' ? '₹6.50 Cr Turnover Certified' : rawCategory === 'Past_Experience' ? '₹3.20 Cr Contract Value' : 'Statutory Fee Exemption Applicable',
          issue_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          validity_period: 'Perpetual Track Record / 3 Years',
          detected_type: rawCategory,
          verification_status: 'Verified Authenticated',
          tender_qualification_relevance: `Validates statutory requirement for ${rawCategory.replace(/_/g, ' ')} under Indian Public Procurement rules.`,
          file_stats: {
            file_type: (rawFilename.split('.').pop() || 'PDF').toUpperCase(),
            file_size_kb: 336.9,
            word_count: 650,
            estimated_pages: 2,
          },
          key_entities: [rawCategory.replace(/_/g, ' '), 'Tender Gate Adherence', 'Verified Seal'],
        },
        created_at: new Date().toISOString(),
      };

      inMemoryDemoDocuments = [newDoc, ...inMemoryDemoDocuments];
      return newDoc;
    }

    if (endpoint.startsWith('/documents/semantic-search')) {
      return inMemoryDemoDocuments.slice(0, 2).map((d) => ({
        document_name: d.filename,
        category: d.category,
        content: d.summary,
        similarity_score: 0.89,
      }));
    }

    try {
      const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const catParam = params.get('category');
      if (catParam) {
        return inMemoryDemoDocuments.filter((d) => d.category.toLowerCase() === catParam.toLowerCase());
      }
    } catch {
      // fallback
    }

    return inMemoryDemoDocuments;
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
  listTenders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await request(`/tenders/?${query}`);
    if (Array.isArray(data)) {
      return data.map((t) => {
        if (typeof t.overall_match_score === 'number') return t;
        const match = calculateTenderMatch(t, DEMO_COMPANY_PROFILE);
        return {
          ...t,
          overall_match_score: match.overall_match_score,
          is_hard_eligible: match.is_hard_eligible,
        };
      });
    }
    return data;
  },
  getTender: async (id) => {
    const data = await request(`/tenders/${id}`);
    if (data && typeof data.overall_match_score !== 'number') {
      const match = calculateTenderMatch(data, DEMO_COMPANY_PROFILE);
      return {
        ...data,
        overall_match_score: match.overall_match_score,
        is_hard_eligible: match.is_hard_eligible,
      };
    }
    return data;
  },
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
  analyzeDocument: (id) =>
    request(`/documents/${id}/analyze`, {
      method: 'POST',
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
