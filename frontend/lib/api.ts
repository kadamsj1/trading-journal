import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ withCredentials = true म्हणजे browser आपोआप HttpOnly cookie पाठवतो
  // JavaScript ला cookie दिसत नाही — XSS safe
  withCredentials: true,
});

// CSRF token storage
let csrfToken: string | null = null;

// Request interceptor — CSRF token add करतो (token localStorage मधून नाही, cookie मधून येतो)
api.interceptors.request.use(
  async (config) => {
    // CSRF token for state-changing requests
    const stateMethods = ['post', 'put', 'patch', 'delete'];
    if (config.method && stateMethods.includes(config.method.toLowerCase())) {
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — 401 वर login page वर redirect
api.interceptors.response.use(
  (response) => {
    // CSRF token capture from response header
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Cookie invalid/expired — redirect to login
      // (Token clear करणे लागत नाही — server /logout वर cookie clear करतो)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403 && error.response?.data?.detail?.includes('CSRF')) {
      csrfToken = null;
      console.error('CSRF protection error:', error.response.data.detail);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  // Login — server sets HttpOnly cookie automatically
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  // Logout — server clears the cookie
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; new_password: string }) =>
    api.post('/auth/reset-password', data),
};

// Users API (Admin only)
export const usersApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/users?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Portfolios API
export const portfoliosApi = {
  getAll: () => api.get('/portfolios'),
  create: (data: { name: string; description?: string; initial_balance: number }) =>
    api.post('/portfolios', data),
  getById: (id: number) => api.get(`/portfolios/${id}`),
  update: (id: number, data: any) => api.patch(`/portfolios/${id}`, data),
  delete: (id: number) => api.delete(`/portfolios/${id}`),
};

// Trades API
export const tradesApi = {
  getByPortfolio: (portfolioId: number, status?: string) => {
    const url = status
      ? `/trades/portfolio/${portfolioId}?status=${status}`
      : `/trades/portfolio/${portfolioId}`;
    return api.get(url);
  },
  create: (data: any) => api.post('/trades', data),
  getById: (id: number) => api.get(`/trades/${id}`),
  update: (id: number, data: any) => api.patch(`/trades/${id}`, data),
  close: (id: number, data: { exit_price: number; exit_date: string }) =>
    api.post(`/trades/${id}/close`, data),
  uploadScreenshot: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/trades/${id}/screenshot`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete(`/trades/${id}`),
};

// Analytics API
export const analyticsApi = {
  getPortfolioAnalytics: (portfolioId: number) =>
    api.get(`/analytics/portfolio/${portfolioId}`),
  getBySymbol: (portfolioId: number) =>
    api.get(`/analytics/portfolio/${portfolioId}/by-symbol`),
  getDailyPL: (portfolioId: number) =>
    api.get(`/analytics/portfolio/${portfolioId}/daily-pl`),
  getWeeklyPerformance: (portfolioId: number) =>
    api.get(`/analytics/portfolio/${portfolioId}/weekly-performance`),
};

// Daily Charges API
export const chargesApi = {
  getByPortfolio: (portfolioId: number) => api.get(`/charges/portfolio/${portfolioId}`),
  create: (data: { portfolio_id: number; date: string; amount: number; notes?: string }) =>
    api.post('/charges', data),
  update: (id: number, data: { date?: string; amount?: number; notes?: string }) =>
    api.patch(`/charges/${id}`, data),
  delete: (id: number) => api.delete(`/charges/${id}`),
};

// Brokers API
export const brokersApi = {
  getAll: () => api.get('/brokers'),
  create: (data: {
    broker_name: string;
    client_id?: string;
    api_key?: string;
    api_secret?: string;
  }) => api.post('/brokers', data),
  delete: (id: number) => api.delete(`/brokers/${id}`),
  sync: (id: number, portfolioId: number, fromDate?: string, toDate?: string) => {
    let url = `/brokers/${id}/sync?portfolio_id=${portfolioId}`;
    if (fromDate) url += `&from_date=${fromDate}`;
    if (toDate) url += `&to_date=${toDate}`;
    return api.post(url);
  },
  getIIFLLoginUrl: () => api.get('/brokers/iifl/login-url'),
};

// Vault / Ledger API
export const vaultApi = {
  getByPortfolio: (portfolioId: number) => api.get(`/vault/portfolio/${portfolioId}`),
  getSummary: (portfolioId: number) => api.get(`/vault/portfolio/${portfolioId}/summary`),
  create: (
    portfolioId: number,
    data: {
      transaction_type: 'deposit' | 'withdrawal';
      amount: number;
      date: string;
      notes?: string;
    }
  ) => api.post(`/vault/portfolio/${portfolioId}`, data),
  update: (
    id: number,
    data: {
      transaction_type?: 'deposit' | 'withdrawal';
      amount?: number;
      date?: string;
      notes?: string;
    }
  ) => api.patch(`/vault/${id}`, data),
  delete: (id: number) => api.delete(`/vault/${id}`),
  dayClosePreview: (portfolioId: number, closeDate: string) =>
    api.get(`/vault/portfolio/${portfolioId}/day-close/preview?close_date=${closeDate}`),
  dayCloseExecute: (portfolioId: number, closeDate: string) =>
    api.post(`/vault/portfolio/${portfolioId}/day-close?close_date=${closeDate}`),
};

export default api;
