// Thin wrapper around the Umami tracker. Keeps the optional-chaining guard in
// one place so call sites stay clean, and gives us a single point to enrich or
// disable analytics. No-ops safely when the Umami script isn't loaded
// (analytics disabled, or running inside the Capacitor native shell).
export function track(name, data) {
  if (typeof window === "undefined") return;
  window.umami?.track(name, data);
}
