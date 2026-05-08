/**
 * analytics.ts
 *
 * Thin analytics shim for LuckyDay.
 *
 * Default behavior: no-op. This module is intentionally inert until a real
 * backend is wired in (PostHog, Amplitude, Mixpanel, etc.). Call sites can
 * already use the API; flipping the backend is a one-file change.
 *
 * To enable a real backend later:
 *   1. Install the SDK (e.g. `npm install posthog-react-native`)
 *   2. Replace the bodies of `track`, `identify`, `setUserProperties` below
 *   3. Initialize the SDK from `app/_layout.tsx` with `initAnalytics()`
 *
 * Why a typed event union?
 *   Forces every event name to be declared centrally. Prevents typos,
 *   enables refactor-safe rename, and gives a single place to audit
 *   what data we collect (privacy review).
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

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the analytics backend. Call once from `app/_layout.tsx`.
 * No-op until a backend is wired in.
 */
export async function initAnalytics(): Promise<void> {
  // TODO: replace with PostHog / Amplitude init when backend is chosen.
}

/**
 * Track an event. Safe to call from anywhere — fails silently.
 */
export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  // TODO: forward to backend. Keep this body short and synchronous —
  // analytics calls must never block UI or throw.
  void event;
  void properties;
}

/**
 * Associate the current session with a stable anonymous ID.
 * LuckyDay has no accounts, so this is the device-local profile ID
 * (or a randomly-generated install ID).
 */
export function identify(userId: string, traits?: AnalyticsProperties): void {
  void userId;
  void traits;
}

/**
 * Update properties on the current user (e.g. premium status changed).
 */
export function setUserProperties(traits: AnalyticsProperties): void {
  void traits;
}
