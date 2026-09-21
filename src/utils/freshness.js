// Relative "last updated" label for screens that refresh themselves in the
// background. Those refreshes deliberately skip the global loading modal, so
// without a line like this there's no way to tell whether what's on screen is
// current or minutes stale.
export function formatUpdatedAgo(updatedAt, now = Date.now()) {
  if (!updatedAt) return "";
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}
