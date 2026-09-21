const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

export const SELF_REGISTER_RATE_LIMIT_RETRY_AFTER_SECONDS = 3600;

interface RequestWindow {
  count: number;
  windowStartedAt: number;
}

const requestsByIp = new Map<string, RequestWindow>();

function currentWindow(ip: string, now: number): RequestWindow | undefined {
  const window = requestsByIp.get(ip);
  if (window && now - window.windowStartedAt >= WINDOW_MS) {
    requestsByIp.delete(ip);
    return undefined;
  }
  return window;
}

export function isRateLimited(ip: string, now: number = Date.now()): boolean {
  const window = currentWindow(ip, now);
  return (window?.count ?? 0) >= MAX_REQUESTS_PER_WINDOW;
}

// Every request counts toward this limit, not only failed ones (unlike
// rbac-api-security's login limiter) — per-IP self-register attempts include a
// 409 (Admin already exists) as a countable attempt, per QT23/QT24.
export function recordRequest(ip: string, now: number = Date.now()): void {
  const window = currentWindow(ip, now);
  if (!window) {
    requestsByIp.set(ip, { count: 1, windowStartedAt: now });
    return;
  }
  window.count += 1;
}

// Test-only reset hook. Deliberately not `jest.resetModules()` at the call
// site — that would also reset the shared `mongoose` connection singleton,
// breaking dynamically re-imported DB-backed routes (discovered while writing
// user-management-console.T06's tests).
export function __resetForTests(): void {
  requestsByIp.clear();
}
