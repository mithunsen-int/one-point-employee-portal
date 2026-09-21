const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export const RATE_LIMIT_RETRY_AFTER_SECONDS = 900;

interface AttemptWindow {
  count: number;
  windowStartedAt: number;
}

const failedAttemptsByUsername = new Map<string, AttemptWindow>();

function currentWindow(username: string, now: number): AttemptWindow | undefined {
  const window = failedAttemptsByUsername.get(username);
  if (window && now - window.windowStartedAt >= WINDOW_MS) {
    failedAttemptsByUsername.delete(username);
    return undefined;
  }
  return window;
}

export function isRateLimited(username: string, now: number = Date.now()): boolean {
  const window = currentWindow(username, now);
  return (window?.count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export function recordFailedAttempt(username: string, now: number = Date.now()): void {
  const window = currentWindow(username, now);
  if (!window) {
    failedAttemptsByUsername.set(username, { count: 1, windowStartedAt: now });
    return;
  }
  window.count += 1;
}
