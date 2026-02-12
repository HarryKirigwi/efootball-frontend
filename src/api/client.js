const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// #region agent log
fetch('http://127.0.0.1:7244/ingest/1357bc2d-b052-460a-9bba-5b23097c9172', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    runId: 'pre-fix',
    hypothesisId: 'H1',
    location: 'frontend/src/api/client.js:API_BASE',
    message: 'Frontend API_BASE resolved value',
    data: { API_BASE },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

function getToken() {
  return localStorage.getItem('token');
}

export async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getConfig() {
  return api('/tournament/config');
}

export async function register(body) {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(body) });
}

export async function login(efootball_username, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ efootball_username, password }),
  });
}

export async function getMe() {
  return api('/users/me');
}

export async function updateMe(body) {
  return api('/users/me', { method: 'PATCH', body: JSON.stringify(body) });
}

export async function getPendingPayments() {
  return api('/payments/pending');
}

export async function verifyPayment(id, action) {
  return api(`/payments/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function createAdmin(body) {
  return api('/users/admins', { method: 'POST', body: JSON.stringify(body) });
}

export async function getUsersList(role) {
  const q = role ? `?role=${role}` : '';
  return api(`/users/list${q}`);
}
