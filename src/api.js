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

// Runs `fn` as a single logical loading operation. Holds the read counter at a
// floor of +1 for the whole duration, so multi-step loads (several sequential
// requests) register as one continuous loading state instead of the counter
// dipping to 0 between requests and flickering the global loading modal.
export async function withLoadingScope(fn) {
  activeReadRequests.value += 1;
  try {
    return await fn();
  } finally {
    activeReadRequests.value = Math.max(0, activeReadRequests.value - 1);
  }
}

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
        if (res.status === 401) {
          // Token is missing, expired, or invalid. Drop it and signal the app
          // to log out and redirect to the login page.
          localStorage.removeItem("token");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("auth:expired"));
          }
        }
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
  me: () => request("/auth/me"),
  changePassword: (payload) =>
    request("/auth/password/change", { method: "POST", body: JSON.stringify(payload) }),
  activeSession: (options) => request("/sessions/active", options),
  listSessions: (status) => request(`/sessions${status ? `?status=${status}` : ""}`),
  session: (id, options) => request(`/sessions/${id}`, options),
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
  // Assistants (workspace collaborators)
  listAssistants: () => request(`/assistants`),
  inviteAssistant: (email) =>
    request(`/assistants/invite`, { method: "POST", body: JSON.stringify({ email }) }),
  revokeAssistantInvite: (inviteId) =>
    request(`/assistants/invite/${inviteId}`, { method: "DELETE" }),
  removeAssistant: (userId) =>
    request(`/assistants/${userId}`, { method: "DELETE" }),
  assistantInvite: (token) => request(`/assistants/invites/${token}`),
  publicAssistantInvite: (token) => publicRequest(`/public/assistant-invite/${token}`),
  listWorkspaces: () => request("/workspaces"),
  switchWorkspace: (workspaceId) =>
    request("/workspaces/switch", { method: "POST", body: JSON.stringify({ workspaceId }) }),
  createWorkspace: (name) => request("/workspaces", { method: "POST", body: JSON.stringify({ name }) }),
  renameWorkspace: (id, name) =>
    request(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteWorkspace: (id) => request(`/workspaces/${id}`, { method: "DELETE" }),
  acceptAssistantInvite: (token) =>
    request(`/assistants/invites/${token}/accept`, { method: "POST" }),
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
  balances: (sessionId, options) => request(`/payments/${sessionId}/balances`, options),
  confirmPayment: (sessionId, paymentId) =>
    request(`/payments/${sessionId}/${paymentId}/confirm`, { method: "PATCH" }),
  rejectPayment: (sessionId, paymentId) =>
    request(`/payments/${sessionId}/${paymentId}/reject`, { method: "PATCH" }),
  recordPayment: (sessionId, payload, proofFile) => {
    if (proofFile) {
      const form = new FormData();
      form.append("playerId", payload.playerId);
      form.append("amount", String(payload.amount));
      form.append("method", payload.method);
      if (payload.note) form.append("note", payload.note);
      form.append("proof", proofFile);
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(`${API_URL}/payments/${sessionId}`, { method: "POST", headers, body: form })
        .then((r) => r.json().then((d) => { if (!r.ok) throw new Error(d.error || "Request failed"); return d; }));
    }
    return request(`/payments/${sessionId}`, { method: "POST", body: JSON.stringify(payload) });
  },
  createShareLink: (sessionId, payload) => request(`/share-links/${sessionId}`, { method: "POST", body: JSON.stringify(payload) }),
  revokeShareLink: (id) => request(`/share-links/${id}/revoke`, { method: "POST" }),
  createSessionShareLink: (sessionId) => request(`/share-links/session/${sessionId}`, { method: "POST" }),
  createSessionInviteLink: (sessionId) => request(`/share-links/session-invite/${sessionId}`, { method: "POST" }),
  publicFeesSession: (token, options) => publicRequest(`/public/fees-session/${token}`, options),
  publicSubmitProof: (token, playerId, method, proofFile) => {
    const form = new FormData();
    form.append("playerId", playerId);
    form.append("method", method);
    form.append("proof", proofFile);
    return fetch(`${API_URL}/public/fees-session/${token}/proof`, { method: "POST", body: form })
      .then((r) => r.json().then((d) => { if (!r.ok) throw new Error(d.error || "Request failed"); return d; }));
  },
  publicPlayer: (token) => publicRequest(`/public/player/${token}`),
  publicQueue: (token, options) => publicRequest(`/public/queue/${token}`, options),
  publicQueueRankings: (token, options) => publicRequest(`/public/queue/${token}/rankings`, options),
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
  publicSubmitJoinProof: (token, playerId, method, proofFile) => {
    const form = new FormData();
    form.append("playerId", playerId);
    form.append("method", method);
    form.append("proof", proofFile);
    return fetch(`${API_URL}/public/session-invite/${token}/proof`, { method: "POST", body: form })
      .then((r) => r.json().then((d) => { if (!r.ok) throw new Error(d.error || "Request failed"); return d; }));
  },
  publicBoard: (sessionId) => publicRequest(`/public/board/${sessionId}`)
};
