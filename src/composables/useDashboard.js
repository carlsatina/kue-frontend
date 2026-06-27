import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, withLoadingScope } from "../api.js";
import { track } from "../utils/analytics.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

export function useDashboard() {
  const router = useRouter();

  const session = ref(null);
  const courts = ref([]);
  const error = ref("");
  const nowTick = ref(Date.now());
  let timerId = null;

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

  // ── Data loading ──────────────────────────────────────────────────────────

  function refresh() {
    // One logical loading operation across the sequential requests below,
    // so the global loading modal stays continuous instead of flickering.
    return withLoadingScope(refreshImpl);
  }

  async function refreshImpl() {
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
    } catch {
      session.value = null;
      courts.value = [];
    } finally {
      document.dispatchEvent(new Event("sessions:updated"));
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

  async function finishMatch() {
    if (!session.value || !endMatchCourt.value?.currentMatchId) return;
    try {
      const payload = { matchId: endMatchCourt.value.currentMatchId };
      const scoreA = parseScoreValue(endMatchScoreA.value);
      const scoreB = parseScoreValue(endMatchScoreB.value);
      if (scoreA != null && scoreB != null) {
        payload.score = { team1: scoreA, team2: scoreB };
        if (scoreA > scoreB) payload.winnerTeam = 1;
        else if (scoreB > scoreA) payload.winnerTeam = 2;
        // equal scores = draw, no winnerTeam
      } else if (scoreA != null || scoreB != null) {
        const score = {};
        if (scoreA != null) score.team1 = scoreA;
        if (scoreB != null) score.team2 = scoreB;
        payload.score = score;
      }
      await api.endMatch(session.value.id, payload);
      track("match-ended");
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
    const link = await api.createSessionShareLink(session.value.id);
    track("share-link-created", { from: "dashboard", type: "queue" });
    inviteLink.value = `${link.appBaseUrl || "https://kue.arshii.net"}/q/${link.token}`;
    try {
      await navigator.clipboard.writeText(inviteLink.value);
      inviteCopied.value = true;
      if (inviteCopyTimer) window.clearTimeout(inviteCopyTimer);
      inviteCopyTimer = window.setTimeout(() => {
        inviteCopied.value = false;
      }, 2000);
    } catch {
      // Clipboard unavailable — fall back to the modal so the link can be copied manually.
      showInviteLink.value = true;
    }
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

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    session, courts, error,
    // Court add
    showAddCourt, newCourtName, newCourtNotes, addCourtError,
    // Court edit
    showEditCourt, editCourtName, editCourtNotes, editCourtError,
    // Court delete
    showDeleteCourt, deleteCourtName, deleteCourtError,
    // End match
    showEndMatch, endMatchError, endMatchTeams, endMatchScoreA, endMatchScoreB,
    // Invite
    showInviteLink, inviteLink, inviteCopied, showInviteWarning,
    // Actions
    refresh,
    createCourt, closeAddCourt,
    openEditCourt, updateCourt, closeEditCourt,
    deleteCourt, confirmDeleteCourt, closeDeleteCourt,
    openEndMatch, closeEndMatch, finishMatch,
    cancelMatch,
    createInviteLink, copyInviteLink, closeInviteLink, closeInviteWarning,
    goToPlayers,
    // Formatters / helpers
    teamNames, elapsedTime,
    courtStatusLabel, courtDotClass,
  };
}
