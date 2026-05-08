/**
 * analytics.ts
 *
 * Thin analytics wrapper for LuckyDay — PostHog-backed.
 *
 * The module is inert until `EXPO_PUBLIC_POSTHOG_API_KEY` is set:
 * `track`, `identify`, etc. all become no-ops if PostHog hasn't been
 * configured. This means call sites can be wired throughout the app
 * without risk before the analytics backend is fully provisioned.
 *
 * Setup (one-time):
 *   1. Create a free PostHog account at https://us.posthog.com
 *   2. Get the project API key (starts with `phc_…`)
 *   3. Set `EXPO_PUBLIC_POSTHOG_API_KEY=phc_…` in `.env`
 *      (or via EAS build secrets for production builds)
 *   4. Optionally set `EXPO_PUBLIC_POSTHOG_HOST` (defaults to US cloud)
 *   5. Call `initAnalytics()` once from `app/_layout.tsx`
 *
 * Privacy: events are anonymous by default. Identify only with the
 * device-local profile ID (no PII).
 */

// ─── Event taxonomy ──────────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Lifecycle
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  // Reading flow
  | 'reading_viewed'
  | 'reading_shared'
  | 'history_viewed'
  // Monetization
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'purchase_started'
  | 'purchase_succeeded'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'purchase_restored'
  // Ritual
  | 'streak_milestone_hit'
  | 'reminder_scheduled'
  | 'reminder_disabled';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

// ─── Config ──────────────────────────────────────────────────────────────────

const POSTHOG_API_KEY: string | undefined = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST: string =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// ─── Lazy PostHog import ─────────────────────────────────────────────────────

type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  register: (properties: Record<string, unknown>) => void;
};

let client: PostHogClient | null = null;
let initPromise: Promise<PostHogClient | null> | null = null;

async function loadClient(): Promise<PostHogClient | null> {
  if (client) return client;
  if (!POSTHOG_API_KEY) return null;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const mod = await import('posthog-react-native');
        const PostHog = mod.default;
        const instance = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST });
        client = instance as unknown as PostHogClient;
        return client;
      } catch {
        return null;
      }
    })();
  }

  return initPromise;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the analytics backend. Call once from `app/_layout.tsx`.
 * No-op if `EXPO_PUBLIC_POSTHOG_API_KEY` is unset.
 */
export async function initAnalytics(): Promise<void> {
  await loadClient();
}

/**
 * Track an event. Safe to call from anywhere — fails silently.
 */
export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (!POSTHOG_API_KEY) return;
  void loadClient().then((c) => {
    if (c) c.capture(event, properties);
  });
}

/**
 * Associate the current session with a stable anonymous ID.
 * LuckyDay has no accounts — pass the device-local profile ID.
 */
export function identify(userId: string, traits?: AnalyticsProperties): void {
  if (!POSTHOG_API_KEY) return;
  void loadClient().then((c) => {
    if (c) c.identify(userId, traits);
  });
}

/**
 * Update properties registered on every event going forward
 * (e.g. premium status, app version).
 */
export function setUserProperties(traits: AnalyticsProperties): void {
  if (!POSTHOG_API_KEY) return;
  void loadClient().then((c) => {
    if (c) c.register(traits);
  });
}
