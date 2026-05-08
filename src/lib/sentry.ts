/**
 * sentry.ts
 *
 * Sentry crash reporting wrapper for LuckyDay.
 *
 * The module is inert until `EXPO_PUBLIC_SENTRY_DSN` is set:
 *   - `initSentryAsync()` becomes a no-op
 *   - `captureException()` becomes a no-op
 *
 * This means we can ship the integration without a Sentry account; flipping
 * a single env var activates production crash reporting.
 *
 * Setup (one-time):
 *   1. Create a free Sentry account at https://sentry.io
 *   2. Create a React Native project — copy the DSN
 *   3. Add to `.env`:
 *      EXPO_PUBLIC_SENTRY_DSN=https://...@o000000.ingest.sentry.io/0000000
 *   4. For EAS production builds:
 *      eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://..."
 *
 * Sourcemap upload (for symbolicated stack traces in Sentry):
 *   - Install the Expo Sentry plugin: see app.json `plugins` array
 *   - Add `SENTRY_AUTH_TOKEN` as an EAS secret (org-level token)
 *   - Sourcemaps upload automatically during EAS build
 *
 * Lazy import:
 *   `@sentry/react-native` includes a native iOS module. The dynamic
 *   `import()` in `loadSentry()` defers native init until after first paint —
 *   matching the lazy-load pattern used by purchases.ts and analytics.ts.
 *   This keeps Sentry off the iOS launch crash path.
 */

const SENTRY_DSN: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN;

type SentryAPI = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, hint?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id?: string } | null) => void;
};

let sentry: SentryAPI | null = null;
let initPromise: Promise<SentryAPI | null> | null = null;

async function loadSentry(): Promise<SentryAPI | null> {
  if (sentry) return sentry;
  if (!SENTRY_DSN) return null;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const mod = await import('@sentry/react-native');
        const SentryModule = mod as unknown as SentryAPI;

        SentryModule.init({
          dsn: SENTRY_DSN,
          // Don't enable debug logging in production builds
          debug: false,
          // Sample 100% of crashes; reduce in v1.1 once volume is known
          tracesSampleRate: 0.1,
          // Privacy-respecting defaults
          sendDefaultPii: false,
          // We install our own global handler in errorHandler.ts; let it
          // forward to Sentry. Disable Sentry's auto-install to avoid
          // double-handling.
          enableAutoSessionTracking: true,
          enableNative: true,
        });

        sentry = SentryModule;
        return sentry;
      } catch {
        return null;
      }
    })();
  }

  return initPromise;
}

/**
 * Initialize Sentry. Call once from `app/_layout.tsx` after the global error
 * handler is installed. No-op if `EXPO_PUBLIC_SENTRY_DSN` is unset.
 */
export async function initSentryAsync(): Promise<void> {
  await loadSentry();
}

/**
 * Capture an exception. Safe to call from anywhere — silently no-ops if
 * Sentry isn't configured.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  void loadSentry().then((s) => {
    if (s) s.captureException(error, context ? { extra: context } : undefined);
  });
}

/**
 * Capture a string message (lower priority than an exception).
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!SENTRY_DSN) return;
  void loadSentry().then((s) => {
    if (s) s.captureMessage(message, level);
  });
}

/**
 * Associate the current session with a stable anonymous ID. LuckyDay has no
 * accounts — pass the device-local profile ID. Pass `null` to clear.
 */
export function setSentryUser(userId: string | null): void {
  if (!SENTRY_DSN) return;
  void loadSentry().then((s) => {
    if (s) s.setUser(userId ? { id: userId } : null);
  });
}
