import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";
import { selectedSessionId, setPendingSessionId, setSelectedSessionId } from "../state/sessionStore.js";

export function useDashboard() {
  const router = useRouter();

  const session = ref(null);
  const courts = ref([]);
  const error = ref("");
  const nowTick = ref(Date.now());
  let timerId = null;

  // Session create
  const newSessionName = ref("Evening Open Play");
  const newGameType = ref("doubles");
  const newSessionMode = ref("usual");
  const feeAmount = ref(100);
  const regularJoinLimit = ref(0);
  const newJoinerLimit = ref(0);
  const showCreateSession = ref(false);
  const createError = ref("");

  // Session edit
  const showEditSession = ref(false);
  const editSessionName = ref("");
  const editGameType = ref("doubles");
  const editSessionMode = ref("usual");
  const editSessionFeeAmount = ref(0);
  const editRegularJoinLimit = ref(0);
  const editNewJoinerLimit = ref(0);
  const editSessionError = ref("");

  // Court add
  const showAddCourt = ref(false);
  const newCourtName = ref("");
  const newCourtNotes = ref("");
  const addCourtError = ref("");

  // Court edit
  const showEditCourt = ref(false);
  const editCourtId = ref("");
  const editCourtName = ref("");
  const editCourtNotes = ref("");
  const editCourtError = ref("");

  // Court delete
  const showDeleteCourt = ref(false);
  const deleteCourtId = ref("");
  const deleteCourtName = ref("");
  const deleteCourtError = ref("");

  // End match
  const showEndMatch = ref(false);
  const endMatchCourt = ref(null);
  const endMatchError = ref("");
  const endMatchTeams = ref({
    teamAName: "Team A",
    teamBName: "Team B",
    teamAPlayers: "—",
    teamBPlayers: "—",
  });
  const endMatchScoreA = ref("");
  const endMatchScoreB = ref("");

  // Invite link
  const showInviteLink = ref(false);
  const inviteLink = ref("");
  const inviteCopied = ref(false);
  const showInviteWarning = ref(false);
  let inviteCopyTimer = null;

  // Past sessions
  const pastSessions = ref([]);
  const showPastSessions = ref(false);
  const showRoster = ref(false);
  const rosterPlayers = ref([]);
  const rosterSession = ref(null);

  // Fee edit
  const showEditFee = ref(false);
  const editFeeAmount = ref(0);
  const editFeeError = ref("");

  // Session delete
  const showDeleteSession = ref(false);
  const deleteSessionTarget = ref(null);
  const deleteSessionError = ref("");

  // ── Data loading ──────────────────────────────────────────────────────────

  async function refresh() {
    try {
      let sessionData = null;
      if (selectedSessionId.value) {
        try {
          sessionData = await api.session(selectedSessionId.value);
        } catch {
          setSelectedSessionId("");
        }
      }
      if (!sessionData) {
        sessionData = await api.activeSession();
        if (sessionData?.id) setSelectedSessionId(sessionData.id);
      }
      if (!sessionData) {
        session.value = null;
        courts.value = [];
        await loadPastSessions();
        regularJoinLimit.value = 0;
        newJoinerLimit.value = 0;
        return;
      }

      let courtSessions = sessionData.courtSessions || [];
      const missingMatches = courtSessions.filter(
        (cs) => cs.currentMatchId && !cs.currentMatch
      );
      if (missingMatches.length) {
        const fetched = await Promise.all(
          missingMatches.map((cs) => api.getMatch(cs.currentMatchId))
        );
        const matchMap = new Map(fetched.map((m) => [m.id, m]));
        courtSessions = courtSessions.map((cs) =>
          cs.currentMatch
            ? cs
            : { ...cs, currentMatch: matchMap.get(cs.currentMatchId) || null }
        );
      }

      const sortedCourts = [...courtSessions].sort((a, b) =>
        courtSortName(a).localeCompare(courtSortName(b), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
      session.value = { ...sessionData, courtSessions: sortedCourts };
      courts.value = sortedCourts;
      await loadPastSessions();
    } catch {
      session.value = null;
      courts.value = [];
      await loadPastSessions();
      regularJoinLimit.value = 0;
      newJoinerLimit.value = 0;
    } finally {
      window.dispatchEvent(new Event("sessions:updated"));
    }
  }

  async function loadPastSessions() {
    try {
      const sessions = await api.listSessions();
      pastSessions.value = (sessions || [])
        .filter((s) => s.status !== "open")
        .sort((a, b) => {
          const aTime = new Date(a.closedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.closedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
    } catch {
      pastSessions.value = [];
    }
  }

  // ── Session actions ───────────────────────────────────────────────────────

  function openCreateSession() {
    createError.value = "";
    showCreateSession.value = true;
  }

  function closeCreateSession() {
    showCreateSession.value = false;
    createError.value = "";
  }

  async function createSession() {
    createError.value = "";
    try {
      const created = await api.createSession({
        name: newSessionName.value,
        gameType: newGameType.value,
        mode: newSessionMode.value,
        feeMode: "flat",
        feeAmount: Number(feeAmount.value),
        regularJoinLimit: Math.max(0, Number(regularJoinLimit.value) || 0),
        newJoinerLimit: Math.max(0, Number(newJoinerLimit.value) || 0),
      });
      await api.openSession(created.id);
      setPendingSessionId(created.id);
      setSelectedSessionId(created.id);
      await refresh();
      showCreateSession.value = false;
    } catch (err) {
      createError.value = err.message || "Unable to create session";
    }
  }

  function openEditSession() {
    if (!session.value) return;
    editSessionError.value = "";
    editSessionName.value = session.value.name || "";
    editGameType.value = session.value.gameType || "doubles";
    editSessionMode.value = session.value.mode || "usual";
    editSessionFeeAmount.value = Number(session.value.feeAmount || 0);
    editRegularJoinLimit.value = Number(session.value.regularJoinLimit || 0);
    editNewJoinerLimit.value = Number(session.value.newJoinerLimit || 0);
    showEditSession.value = true;
  }

  function closeEditSession() {
    showEditSession.value = false;
    editSessionError.value = "";
  }

  async function saveEditSession() {
    if (!session.value) return;
    editSessionError.value = "";
    try {
      await api.updateSession(session.value.id, {
        name: editSessionName.value,
        gameType: editGameType.value,
        mode: editSessionMode.value,
        feeAmount: Number(editSessionFeeAmount.value || 0),
        regularJoinLimit: Math.max(0, Number(editRegularJoinLimit.value) || 0),
        newJoinerLimit: Math.max(0, Number(editNewJoinerLimit.value) || 0),
      });
      showEditSession.value = false;
      await refresh();
    } catch (err) {
      editSessionError.value = err.message || "Unable to update session";
    }
  }

  async function openSession() {
    if (!session.value) return;
    try {
      await api.openSession(session.value.id);
      await refresh();
    } catch (err) {
      error.value = err.message || "Unable to open session";
    }
  }

  async function closeSession() {
    if (!session.value) return;
    await api.closeSession(session.value.id);
    await refresh();
  }

  function openDeleteSession(target) {
    deleteSessionTarget.value = target;
    deleteSessionError.value = "";
    showDeleteSession.value = true;
  }

  function closeDeleteSession() {
    showDeleteSession.value = false;
    deleteSessionTarget.value = null;
    deleteSessionError.value = "";
  }

  async function confirmDeleteSession() {
    if (!deleteSessionTarget.value) return;
    deleteSessionError.value = "";
    try {
      await api.deleteSession(deleteSessionTarget.value.id);
      closeDeleteSession();
      await refresh();
    } catch (err) {
      deleteSessionError.value = err.message || "Unable to delete session";
    }
  }

  async function reopenSession(sessionItem) {
    try {
      await api.openSession(sessionItem.id);
      await refresh();
    } catch (err) {
      error.value = err.message || "Unable to reopen session";
    }
  }

  // ── Fee actions ───────────────────────────────────────────────────────────

  function openEditFee() {
    if (!session.value || session.value.status !== "open") return;
    editFeeAmount.value = Number(session.value.feeAmount || 0);
    editFeeError.value = "";
    showEditFee.value = true;
  }

  function closeEditFee() {
    showEditFee.value = false;
    editFeeError.value = "";
  }

  async function saveEditFee() {
    if (!session.value || session.value.status !== "open") return;
    editFeeError.value = "";
    try {
      await api.updateSessionFee(session.value.id, {
        feeMode: "flat",
        feeAmount: Number(editFeeAmount.value),
      });
      showEditFee.value = false;
      await refresh();
    } catch (err) {
      editFeeError.value = err.message || "Unable to update fee";
    }
  }

  // ── Court actions ─────────────────────────────────────────────────────────

  async function createCourt() {
    addCourtError.value = "";
    if (!newCourtName.value.trim()) {
      addCourtError.value = "Court name is required.";
      return;
    }
    try {
      await api.createCourt({
        name: newCourtName.value.trim(),
        notes: newCourtNotes.value.trim(),
      });
      closeAddCourt();
      await refresh();
    } catch (err) {
      addCourtError.value = err.message || "Unable to create court";
    }
  }

  function closeAddCourt() {
    showAddCourt.value = false;
    newCourtName.value = "";
    newCourtNotes.value = "";
    addCourtError.value = "";
  }

  function openEditCourt(courtSession) {
    const name = courtSession.court?.name || courtSession.name || "";
    editCourtId.value = courtSession.courtId || courtSession.court?.id || courtSession.id;
    editCourtName.value = name;
    editCourtNotes.value = courtSession.court?.notes || courtSession.notes || "";
    editCourtError.value = "";
    showEditCourt.value = true;
  }

  async function updateCourt() {
    if (!editCourtId.value) return;
    if (!editCourtName.value.trim()) {
      editCourtError.value = "Court name is required.";
      return;
    }
    try {
      await api.updateCourt(editCourtId.value, {
        name: editCourtName.value.trim(),
        notes: editCourtNotes.value.trim(),
      });
      closeEditCourt();
      await refresh();
    } catch (err) {
      editCourtError.value = err.message || "Unable to update court";
    }
  }

  function closeEditCourt() {
    showEditCourt.value = false;
    editCourtId.value = "";
    editCourtName.value = "";
    editCourtNotes.value = "";
    editCourtError.value = "";
  }

  async function deleteCourt(courtSession) {
    const courtId = courtSession.courtId || courtSession.court?.id || courtSession.id;
    if (!courtId) return;
    deleteCourtId.value = courtId;
    deleteCourtName.value = courtSession.court?.name || courtSession.name || "this court";
    deleteCourtError.value = "";
    showDeleteCourt.value = true;
  }

  async function confirmDeleteCourt() {
    if (!deleteCourtId.value) return;
    try {
      await api.deleteCourt(deleteCourtId.value);
      closeDeleteCourt();
      await refresh();
    } catch (err) {
      deleteCourtError.value = err.message || "Unable to delete court";
    }
  }

  function closeDeleteCourt() {
    showDeleteCourt.value = false;
    deleteCourtId.value = "";
    deleteCourtName.value = "";
    deleteCourtError.value = "";
  }

  // ── Match actions ─────────────────────────────────────────────────────────

  function openEndMatch(courtSession) {
    if (!session.value || !courtSession.currentMatchId) return;
    endMatchCourt.value = courtSession;
    endMatchError.value = "";
    const teamAName = teamDisplayName(courtSession.currentMatch, 1);
    const teamBName = teamDisplayName(courtSession.currentMatch, 2);
    const teamAPlayers = teamNames(courtSession.currentMatch, 1) || "—";
    const teamBPlayers = teamNames(courtSession.currentMatch, 2) || "—";
    endMatchTeams.value = { teamAName, teamBName, teamAPlayers, teamBPlayers };
    endMatchScoreA.value = "";
    endMatchScoreB.value = "";
    showEndMatch.value = true;
  }

  function closeEndMatch() {
    showEndMatch.value = false;
    endMatchCourt.value = null;
    endMatchError.value = "";
    endMatchTeams.value = {
      teamAName: "Team A",
      teamBName: "Team B",
      teamAPlayers: "—",
      teamBPlayers: "—",
    };
    endMatchScoreA.value = "";
    endMatchScoreB.value = "";
  }

  async function setWinner(winnerTeam) {
    if (!session.value || !endMatchCourt.value?.currentMatchId) return;
    try {
      const payload = { matchId: endMatchCourt.value.currentMatchId };
      if (winnerTeam) payload.winnerTeam = winnerTeam;
      const scoreA = parseScoreValue(endMatchScoreA.value);
      const scoreB = parseScoreValue(endMatchScoreB.value);
      if (scoreA != null || scoreB != null) {
        const score = {};
        if (scoreA != null) score.team1 = scoreA;
        if (scoreB != null) score.team2 = scoreB;
        payload.score = score;
      }
      await api.endMatch(session.value.id, payload);
      closeEndMatch();
      await refresh();
    } catch (err) {
      endMatchError.value = err.message || "Unable to end match";
    }
  }

  async function cancelMatch(courtSession) {
    if (!session.value || !courtSession.currentMatchId) return;
    error.value = "";
    try {
      await api.cancelMatch(session.value.id, { matchId: courtSession.currentMatchId });
      await refresh();
    } catch (err) {
      error.value = err.message || "Unable to cancel match";
    }
  }

  // ── Invite link ───────────────────────────────────────────────────────────

  async function createInviteLink() {
    if (!session.value) {
      showInviteWarning.value = true;
      return;
    }
    const link = await api.createSessionInviteLink(session.value.id);
    inviteLink.value = `${window.location.origin}/join/${link.token}`;
    showInviteLink.value = true;
  }

  async function copyInviteLink() {
    if (!inviteLink.value) return;
    await navigator.clipboard.writeText(inviteLink.value);
    inviteCopied.value = true;
    if (inviteCopyTimer) window.clearTimeout(inviteCopyTimer);
    inviteCopyTimer = window.setTimeout(() => {
      inviteCopied.value = false;
    }, 1500);
  }

  function closeInviteLink() {
    showInviteLink.value = false;
    inviteLink.value = "";
    inviteCopied.value = false;
  }

  function closeInviteWarning() {
    showInviteWarning.value = false;
  }

  // ── Roster ────────────────────────────────────────────────────────────────

  async function viewRoster(sessionItem) {
    rosterSession.value = sessionItem;
    rosterPlayers.value = await api.sessionPlayers(sessionItem.id);
    showRoster.value = true;
  }

  function closeRoster() {
    showRoster.value = false;
    rosterPlayers.value = [];
    rosterSession.value = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function togglePastSessions() {
    showPastSessions.value = !showPastSessions.value;
  }

  function goToPlayers() {
    router.push("/players");
  }

  function teamNames(match, teamNumber) {
    if (!match) return "";
    return match.participants
      .filter((p) => p.teamNumber === teamNumber)
      .map((p) => p.player.nickname || p.player.fullName)
      .join(" + ");
  }

  function teamDisplayName(match, teamNumber) {
    if (!match) return teamNumber === 1 ? "Team A" : "Team B";
    const participants = match.participants.filter((p) => p.teamNumber === teamNumber);
    if (!participants.length) return teamNumber === 1 ? "Team A" : "Team B";
    const names = participants
      .map((p) => p.player?.team?.name)
      .filter((name) => typeof name === "string" && name.trim().length > 0);
    if (names.length === participants.length) {
      const unique = new Set(names.map((name) => name.trim()));
      if (unique.size === 1) return [...unique][0];
    }
    return teamNumber === 1 ? "Team A" : "Team B";
  }

  function formatTime(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function elapsedTime(startedAt) {
    if (!startedAt) return "—";
    const diffMs = Math.max(0, nowTick.value - new Date(startedAt).getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remMinutes = minutes % 60;
      return `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
    }
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  function courtStatusLabel(status) {
    if (status === "in_match") return "Occupied";
    if (status === "maintenance") return "Maintenance";
    if (status === "available") return "Available";
    return status || "—";
  }

  function courtDotClass(court) {
    if (court.status === "maintenance") return "dot-maintenance";
    if (court.currentMatchId || court.status === "in_match" || court.status === "occupied")
      return "dot-active";
    return "";
  }

  function courtSortName(courtSession) {
    return (courtSession?.court?.name || courtSession?.name || "").trim();
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function parseScoreValue(value) {
    if (value === "" || value === null || value === undefined) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onMounted(() => {
    refresh();
    timerId = setInterval(() => {
      nowTick.value = Date.now();
    }, 1000);
  });

  onUnmounted(() => {
    if (timerId) clearInterval(timerId);
  });

  watch(selectedSessionId, () => {
    refresh();
  });

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    // State
    session, courts, error, nowTick,
    // Session create
    newSessionName, newGameType, newSessionMode, feeAmount,
    regularJoinLimit, newJoinerLimit, showCreateSession, createError,
    // Session edit
    showEditSession, editSessionName, editGameType, editSessionMode,
    editSessionFeeAmount, editRegularJoinLimit, editNewJoinerLimit, editSessionError,
    // Court add
    showAddCourt, newCourtName, newCourtNotes, addCourtError,
    // Court edit
    showEditCourt, editCourtId, editCourtName, editCourtNotes, editCourtError,
    // Court delete
    showDeleteCourt, deleteCourtId, deleteCourtName, deleteCourtError,
    // End match
    showEndMatch, endMatchCourt, endMatchError, endMatchTeams, endMatchScoreA, endMatchScoreB,
    // Invite
    showInviteLink, inviteLink, inviteCopied, showInviteWarning,
    // Past sessions
    pastSessions, showPastSessions, showRoster, rosterPlayers, rosterSession,
    // Fee
    showEditFee, editFeeAmount, editFeeError,
    // Session delete
    showDeleteSession, deleteSessionTarget, deleteSessionError,
    // Actions
    refresh,
    openCreateSession, closeCreateSession, createSession,
    openEditSession, closeEditSession, saveEditSession,
    openSession, closeSession,
    openDeleteSession, closeDeleteSession, confirmDeleteSession,
    reopenSession,
    openEditFee, closeEditFee, saveEditFee,
    createCourt, closeAddCourt,
    openEditCourt, updateCourt, closeEditCourt,
    deleteCourt, confirmDeleteCourt, closeDeleteCourt,
    openEndMatch, closeEndMatch, setWinner,
    cancelMatch,
    createInviteLink, copyInviteLink, closeInviteLink, closeInviteWarning,
    viewRoster, closeRoster,
    togglePastSessions, goToPlayers,
    // Formatters / helpers
    teamNames, teamDisplayName, formatTime, elapsedTime,
    courtStatusLabel, courtDotClass, courtSortName, formatDateTime, parseScoreValue,
  };
}
