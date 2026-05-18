// ── API Helper ──────────────────────────────
const API_BASE = '/api';

const api = {
  getToken: () => localStorage.getItem('qms_token'),
  getUser: () => JSON.parse(localStorage.getItem('qms_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('qms_token', token);
    localStorage.setItem('qms_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('qms_token');
    localStorage.removeItem('qms_user');
  },
  isLoggedIn: () => !!localStorage.getItem('qms_token'),

  request: async (method, path, body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = api.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok && res.status === 401) {
      api.clearAuth();
      window.router.navigate('login');
    }
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
};
