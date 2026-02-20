import { computed, ref } from "vue";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const activeReadRequests = ref(0);

function withLoading(promise, enabled) {
  if (!enabled) return promise;
  activeReadRequests.value += 1;
  return promise.finally(() => {
    activeReadRequests.value = Math.max(0, activeReadRequests.value - 1);
  });
}

export const isReadingFromBackend = computed(() => activeReadRequests.value > 0);

async function request(path, options = {}) {
  const { showLoading, ...requestOptions } = options;
  const method = (requestOptions.method || "GET").toUpperCase();
  const shouldShowLoading = showLoading ?? method === "GET";

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return withLoading(
    (async () => {
      const res = await fetch(`${API_URL}${path}`, {
        ...requestOptions,
        headers
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }
      return data;
    })(),
    shouldShowLoading
  );
}

function publicRequest(path, options = {}) {
  const { showLoading, ...requestOptions } = options;
  const method = (requestOptions.method || "GET").toUpperCase();
  const shouldShowLoading = showLoading ?? method === "GET";
  return withLoading(fetch(`${API_URL}${path}`, requestOptions).then((r) => r.json()), shouldShowLoading);
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  verifyEmail: (token) => request(`/auth/verify?token=${encodeURIComponent(token)}`),
  requestPasswordReset: (payload) =>
    request("/auth/password/forgot", { method: "POST", body: JSON.stringify(payload) }),
  resetPassword: (payload) =>
    request("/auth/password/reset", { method: "POST", body: JSON.stringify(payload) }),
  activeSession: () => request("/sessions/active"),
  listSessions: (status) => request(`/sessions${status ? `?status=${status}` : ""}`),
  session: (id) => request(`/sessions/${id}`),
  sessionPlayers: (sessionId) => request(`/sessions/${sessionId}/players`),
  rankings: (sessionId) => request(`/sessions/${sessionId}/rankings`),
  bracketOverrides: (sessionId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sessions/${sessionId}/bracket-overrides${query ? `?${query}` : ""}`);
  },
  saveBracketOverride: (sessionId, payload) =>
    request(`/sessions/${sessionId}/bracket-overrides`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteBracketOverride: (sessionId, payload) =>
    request(`/sessions/${sessionId}/bracket-overrides`, {
      method: "DELETE",
      body: JSON.stringify(payload)
    }),
  createSession: (payload) => request("/sessions", { method: "POST", body: JSON.stringify(payload) }),
  openSession: (id) => request(`/sessions/${id}/open`, { method: "POST" }),
  closeSession: (id) => request(`/sessions/${id}/close`, { method: "POST" }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: "DELETE" }),
  updateSession: (id, payload) => request(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateSessionFee: (id, payload) => request(`/sessions/${id}/fee`, { method: "PATCH", body: JSON.stringify(payload) }),
  listCourts: () => request("/courts"),
  createCourt: (payload) => request("/courts", { method: "POST", body: JSON.stringify(payload) }),
  updateCourt: (id, payload) => request(`/courts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCourt: (id) => request(`/courts/${id}`, { method: "DELETE" }),
  setCourtStatus: (id, payload) => request(`/courts/${id}/status`, { method: "POST", body: JSON.stringify(payload) }),
  listTeams: () => request("/teams"),
  createTeam: (payload) => request("/teams", { method: "POST", body: JSON.stringify(payload) }),
  updateTeam: (id, payload) => request(`/teams/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTeam: (id) => request(`/teams/${id}`, { method: "DELETE" }),
  updateTeamMembers: (id, payload) =>
    request(`/teams/${id}/members`, { method: "POST", body: JSON.stringify(payload) }),
  listPlayers: () => request("/players"),
  createPlayer: (payload) => request("/players", { method: "POST", body: JSON.stringify(payload) }),
  updatePlayer: (id, payload) => request(`/players/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  checkinPlayer: (id, payload) => request(`/players/${id}/checkin`, { method: "POST", body: JSON.stringify(payload) }),
  presentPlayer: (id, payload) => request(`/players/${id}/present`, { method: "POST", body: JSON.stringify(payload) }),
  checkoutPlayer: (id, payload) => request(`/players/${id}/checkout`, { method: "POST", body: JSON.stringify(payload) }),
  getQueue: (sessionId) => request(`/queue/${sessionId}`),
  enqueue: (sessionId, payload) => request(`/queue/${sessionId}/enqueue`, { method: "POST", body: JSON.stringify(payload) }),
  dequeue: (sessionId, payload) => request(`/queue/${sessionId}/dequeue`, { method: "POST", body: JSON.stringify(payload) }),
  reorder: (sessionId, payload) => request(`/queue/${sessionId}/reorder`, { method: "POST", body: JSON.stringify(payload) }),
  suggestMatch: (sessionId, payload) => request(`/matches/${sessionId}/suggest`, { method: "POST", body: JSON.stringify(payload) }),
  startMatch: (sessionId, payload) => request(`/matches/${sessionId}/start`, { method: "POST", body: JSON.stringify(payload) }),
  endMatch: (sessionId, payload) => request(`/matches/${sessionId}/end`, { method: "POST", body: JSON.stringify(payload) }),
  updateMatchResult: (sessionId, payload) =>
    request(`/matches/${sessionId}/result`, { method: "PATCH", body: JSON.stringify(payload) }),
  cancelMatch: (sessionId, payload) => request(`/matches/${sessionId}/cancel`, { method: "POST", body: JSON.stringify(payload) }),
  getMatch: (id) => request(`/matches/${id}`),
  matchHistory: (sessionId) => request(`/matches/${sessionId}/history`),
  teamStats: (sessionId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sessions/${sessionId}/team-stats${query ? `?${query}` : ""}`);
  },
  balances: (sessionId) => request(`/payments/${sessionId}/balances`),
  recordPayment: (sessionId, payload) => request(`/payments/${sessionId}`, { method: "POST", body: JSON.stringify(payload) }),
  createShareLink: (sessionId, payload) => request(`/share-links/${sessionId}`, { method: "POST", body: JSON.stringify(payload) }),
  revokeShareLink: (id) => request(`/share-links/${id}/revoke`, { method: "POST" }),
  createSessionShareLink: (sessionId) => request(`/share-links/session/${sessionId}`, { method: "POST" }),
  createSessionInviteLink: (sessionId) => request(`/share-links/session-invite/${sessionId}`, { method: "POST" }),
  publicPlayer: (token) => publicRequest(`/public/player/${token}`),
  publicQueue: (token) => publicRequest(`/public/queue/${token}`),
  publicQueueRankings: (token) => publicRequest(`/public/queue/${token}/rankings`),
  publicQueueTeamStats: (token) => publicRequest(`/public/queue/${token}/team-stats`),
  publicQueueBracket: (token) => publicRequest(`/public/queue/${token}/bracket`),
  publicSessionInvite: (token) => publicRequest(`/public/session-invite/${token}`),
  publicSessionInvitePlayers: (token) => publicRequest(`/public/session-invite/${token}/players`),
  publicSessionRegister: (token, payload) =>
    publicRequest(`/public/session-invite/${token}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  publicBoard: (sessionId) => publicRequest(`/public/board/${sessionId}`)
};
