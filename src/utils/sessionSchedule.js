// Formatting helpers for a session's schedule (start/end time) and location.

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const DATE_OPTS = { weekday: "short", month: "short", day: "numeric" };
const TIME_OPTS = { hour: "numeric", minute: "2-digit" };

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Returns a human-readable schedule string, e.g.:
//   "Sat, Jun 27 · 6:00 – 9:00 PM"  (same day)
//   "Sat, Jun 27, 6:00 PM – Sun, Jun 28, 1:00 AM"  (spans days)
//   "Sat, Jun 27 · 6:00 PM"  (start only)
// Returns "" when there is no start or end time.
export function formatSessionSchedule(session) {
  if (!session) return "";
  const start = toDate(session.startsAt);
  const end = toDate(session.endsAt);
  if (!start && !end) return "";

  if (start && end) {
    if (sameDay(start, end)) {
      return `${start.toLocaleDateString(undefined, DATE_OPTS)} · ${start.toLocaleTimeString(undefined, TIME_OPTS)} – ${end.toLocaleTimeString(undefined, TIME_OPTS)}`;
    }
    return `${start.toLocaleDateString(undefined, DATE_OPTS)}, ${start.toLocaleTimeString(undefined, TIME_OPTS)} – ${end.toLocaleDateString(undefined, DATE_OPTS)}, ${end.toLocaleTimeString(undefined, TIME_OPTS)}`;
  }

  const only = start || end;
  return `${only.toLocaleDateString(undefined, DATE_OPTS)} · ${only.toLocaleTimeString(undefined, TIME_OPTS)}`;
}

// Trimmed location string, or "" when absent.
export function formatSessionLocation(session) {
  return session?.location?.trim() || "";
}
