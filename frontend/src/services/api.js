import axios from 'axios';

const getBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api') && !url.endsWith('/api/v1')) {
    url = `${url}/api`;
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
});

// Auto attach Authorization JWT token
API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const candidateToken = localStorage.getItem('candidateToken');

  if (adminToken && (config.url.startsWith('/admin') || config.url.match(/^\/(candidates|job-roles|templates|question-bank|campaigns|reports|results|analytics|exports|audit-log)/))) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (candidateToken) {
    config.headers.Authorization = `Bearer ${candidateToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const adminAuth = {
  login: (data) => API.post('/admin/auth/login', data),
  me: () => API.get('/admin/auth/me'),
};

export const dashboard = {
  getStats: () => API.get('/admin/dashboard'),
};

export const candidates = {
  list: (params) => API.get('/candidates', { params }),
  create: (data) => API.post('/candidates', data),
  get: (id) => API.get(`/candidates/${id}`),
  update: (id, data) => API.put(`/candidates/${id}`, data),
  delete: (id) => API.delete(`/candidates/${id}`),
  addNote: (id, text) => API.post(`/candidates/${id}/notes`, { text }),
  retry: (id, reason) => API.post(`/candidates/${id}/retry`, { reason }),
  extend: (id, extensionDays) => API.post(`/candidates/${id}/extend`, { extensionDays }),
  regenerateCode: (id, reason) => API.post(`/candidates/${id}/regenerate-code`, { reason }),
  importPreview: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/candidates/import-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importConfirm: (candidatesList) => API.post('/candidates/import-confirm', { candidates: candidatesList }),
  resendEmail: (id) => API.post(`/candidates/${id}/resend-email`),
  importBulk: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/candidates/import-bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getRegistry: () => API.get('/candidates/registry'),
  retryWhatsApp: (id) => API.post(`/candidates/${id}/retry-whatsapp`),
  bulkDelete: (ids) => API.post('/candidates/bulk-delete', { candidateIds: ids }),
};

export const settings = {
  get: () => API.get('/admin/settings'),
  update: (data) => API.put('/admin/settings', data),
};

export const jobRoles = {
  list: (params) => API.get('/job-roles', { params }),
  create: (data) => API.post('/job-roles', data),
  get: (id) => API.get(`/job-roles/${id}`),
  update: (id, data) => API.put(`/job-roles/${id}`, data),
  delete: (id) => API.delete(`/job-roles/${id}`),
};

export const templates = {
  list: () => API.get('/templates'),
  create: (data) => API.post('/templates', data),
  get: (id) => API.get(`/templates/${id}`),
  update: (id, data) => API.put(`/templates/${id}`, data),
  getVersions: (id) => API.get(`/templates/${id}/versions`),
  restore: (id, versionId) => API.post(`/templates/${id}/restore/${versionId}`),
};

export const questionBank = {
  list: (params) => API.get('/question-bank', { params }),
  create: (data) => API.post('/question-bank', data),
  update: (id, data) => API.put(`/question-bank/${id}`, data),
  delete: (id) => API.delete(`/question-bank/${id}`),
  
  // Mandatory questions
  listMandatory: () => API.get('/question-bank/mandatory'),
  createMandatory: (data) => API.post('/question-bank/mandatory', data),
  updateMandatory: (id, data) => API.put(`/question-bank/mandatory/${id}`, data),
  deleteMandatory: (id) => API.delete(`/question-bank/mandatory/${id}`),
};

export const campaigns = {
  list: () => API.get('/campaigns'),
  get: (id) => API.get(`/campaigns/${id}`),
  create: (data) => API.post('/campaigns', data),
  update: (id, data) => API.put(`/campaigns/${id}`, data),
  delete: (id) => API.delete(`/campaigns/${id}`),
};

export const invitations = {
  verifyCode: (code) => API.get(`/invitations/verify-code/${code}`),
  verifyLink: (token) => API.get(`/invitations/verify-link/${token}`),
  activate: (data) => API.post('/invitations/activate', data),
};

export const resumes = {
  upload: (candidateId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return API.post(`/resumes/upload/${candidateId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const identity = {
  uploadSelfie: (candidateId, imageBase64) => API.post(`/identity/selfie/${candidateId}`, { image: imageBase64 }),
  verifyFace: (candidateId, imageBase64) => API.post(`/identity/verify/${candidateId}`, { image: imageBase64 }),
};

export const systemCheck = {
  save: (candidateId, data) => API.post(`/system-check/${candidateId}`, data),
};

export const calibration = {
  uploadAudio: (candidateId, file) => {
    const formData = new FormData();
    formData.append('audio', file);
    return API.post(`/calibration/${candidateId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const interviews = {
  start: (data) => API.post('/interviews/start', data),
  get: (id) => API.get(`/interviews/session/${id}`),
  nextQuestion: (sessionId) => API.post('/interviews/next-question', { sessionId }),
  submitAnswer: (data) => {
    const formData = new FormData();
    formData.append('sessionId', data.sessionId);
    formData.append('questionIndex', data.questionIndex);
    formData.append('remainingTimeSeconds', data.remainingTimeSeconds || 0);
    if (data.audioBlob) {
      formData.append('audio', data.audioBlob, `answer-${data.questionIndex}.webm`);
    }
    return API.post('/interviews/submit-answer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  complete: (sessionId) => API.post('/interviews/complete', { sessionId }),
  pause: (id) => API.post(`/interviews/${id}/pause`),
  resume: (id) => API.post(`/interviews/${id}/resume`),
  terminate: (id) => API.post(`/interviews/${id}/terminate`),
  reportCheating: (data) => API.post('/anti-cheating/event', {
    sessionId: data.sessionId,
    eventType: data.type,
    details: data.details
  }),
};

export const reports = {
  get: (sessionId) => API.get(`/reports/session/${sessionId}`),
  regenerate: (sessionId) => API.post(`/reports/session/${sessionId}/regenerate`),
};

export const results = {
  decide: (data) => API.post('/results/decide', data),
  release: (data) => API.post('/results/release', data),
  getReleasedResult: (candidateId) => API.get(`/results/candidate/${candidateId}`),
  getStatus: (candidateId) => API.get(`/results/candidate/${candidateId}/status`),
};

export const notifications = {
  list: (params) => API.get('/notifications', { params }),
  read: (id) => API.post(`/notifications/${id}/read`),
};

export const analytics = {
  get: (params) => API.get('/analytics', { params }),
};

export const auditLog = {
  list: () => API.get('/audit-log'),
};

export default API;
