const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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

export async function updateConfig(body) {
  return api('/tournament/config', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
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

export async function getUser(id) {
  return api(`/users/${id}`);
}

export async function updateUser(id, body) {
  return api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function approveUserAsParticipant(id) {
  return updateUser(id, { is_participant: true });
}

export async function getActiveParticipants() {
  return api('/participants/active');
}

export async function eliminateParticipant(id) {
  return api(`/participants/${id}/eliminate`, { method: 'POST' });
}

export async function getMatches(params = {}) {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.round_id) sp.set('round_id', params.round_id);
  if (params.published !== undefined) sp.set('published', String(params.published ? 1 : 0));
  const q = sp.toString() ? `?${sp.toString()}` : '';
  return api(`/matches${q}`);
}

export async function getMatch(id) {
  return api(`/matches/${id}`);
}

export async function updateMatch(id, body) {
  return api(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function createMatch(body) {
  return api('/matches', { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteMatch(id) {
  return api(`/matches/${id}`, { method: 'DELETE' });
}

export async function publishMatch(id, body = {}) {
  return api(`/matches/${id}/publish`, { method: 'POST', body: JSON.stringify(body) });
}

export async function startMatch(id) {
  return api(`/matches/${id}/start`, { method: 'POST' });
}

export async function addMatchEvent(id, { event_type, minute }) {
  return api(`/matches/${id}/events`, {
    method: 'POST',
    body: JSON.stringify({ event_type, minute }),
  });
}

export async function endMatch(id, body) {
  return api(`/matches/${id}/end`, { method: 'POST', body: JSON.stringify(body) });
}

export async function getRounds() {
  return api('/rounds');
}

export async function createRound(body) {
  return api('/rounds', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateRound(id, body) {
  return api(`/rounds/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteRound(id) {
  return api(`/rounds/${id}`, { method: 'DELETE' });
}

export async function getSuggestedMatches(roundId) {
  const sp = new URLSearchParams({ round_id: roundId });
  return api(`/matches/suggested?${sp.toString()}`);
}

export async function getBracket() {
  return api('/bracket');
}

export async function seedBracket(body = {}) {
  return api('/bracket/seed', { method: 'POST', body: JSON.stringify(body) });
}
