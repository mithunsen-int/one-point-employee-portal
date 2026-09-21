// Isolated in its own module so callers outside React (e.g. authenticatedFetch,
// which has no router instance available) can trigger a redirect, and so
// tests can mock this one function instead of fighting jsdom's real,
// increasingly non-configurable Location object.
export function redirectToLogin(): void {
  // Deliberate: this function exists specifically for callers outside the
  // React tree (e.g. authenticatedFetch.ts), which have no useRouter()
  // instance available.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login";
}
