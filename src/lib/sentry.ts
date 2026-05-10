/**
 * sentry.ts
 *
 * Inert Sentry wrapper. The `@sentry/react-native` package was removed from
 * dependencies in the iPad-rejection cleanup pass — its native pod auto-loaded
 * Objective-C exception handlers that increased crash-handler conflict surface
 * on iPadOS 26 for zero current benefit (no DSN was configured).
 *
 * All exports remain so call sites in errorHandler.ts and ErrorBoundary.tsx
 * continue to work unchanged. Re-add the native package and restore dynamic
 * import logic in v1.1 when wired with a real DSN and iPad test access.
 */

export async function initSentryAsync(): Promise<void> {
  // no-op
}

export function captureException(_error: unknown, _context?: Record<string, unknown>): void {
  // no-op
}

export function captureMessage(_message: string, _level: 'info' | 'warning' | 'error' = 'info'): void {
  // no-op
}

export function setSentryUser(_userId: string | null): void {
  // no-op
}
