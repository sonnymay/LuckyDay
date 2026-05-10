/**
 * analytics.ts
 *
 * Inert analytics wrapper. The `posthog-react-native` package was removed from
 * dependencies in the iPad-rejection cleanup pass — its native pod auto-loaded
 * background workers and crash-handler hooks that increased risk surface on
 * iPadOS 26 for zero current benefit (no API key was configured).
 *
 * All exports remain so existing call sites in purchases.ts and elsewhere
 * continue to work unchanged. Re-add the native package and restore dynamic
 * import logic in v1.1 when wired with a real PostHog project.
 */

export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'reading_viewed'
  | 'reading_shared'
  | 'history_viewed'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'purchase_started'
  | 'purchase_succeeded'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'purchase_restored'
  | 'streak_milestone_hit'
  | 'reminder_scheduled'
  | 'reminder_disabled';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export async function initAnalytics(): Promise<void> {
  // no-op
}

export function track(_event: AnalyticsEvent, _properties?: AnalyticsProperties): void {
  // no-op
}

export function identify(_userId: string, _traits?: AnalyticsProperties): void {
  // no-op
}

export function setUserProperties(_traits: AnalyticsProperties): void {
  // no-op
}
