/**
 * errorHandler.ts
 *
 * Global JS error containment for LuckyDay.
 *
 * Why this exists:
 *   Build 10 was rejected for crash-on-launch on iPad Air 11-inch / iPadOS 26.4.2.
 *   The crash signature was a JS-thrown unhandled exception escalating through
 *   React Native's RCTExceptionsManager → objc_exception_rethrow → abort().
 *
 *   This module installs a global JS error handler so that any thrown error
 *   on the JS thread is logged and persisted, but does NOT call abort. The
 *   app continues running. Render errors are caught separately by the
 *   ErrorBoundary component.
 *
 * Persistence:
 *   The most recent error is written to AsyncStorage under
 *   `luckyday.lastError.v1`. Surface it from a debug screen if needed.
 *
 * Trade-off:
 *   Suppressing fatal errors hides the underlying bug. Pair this with Sentry
 *   or similar cloud crash reporting in v1.1 so we can fix the real cause
 *   without shipping another rejection cycle.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from './sentry';

const LAST_ERROR_KEY = 'luckyday.lastError.v1';

type StoredError = {
  message: string;
  stack: string | null;
  isFatal: boolean;
  timestamp: string;
};

let installed = false;

export function installGlobalErrorHandler(): void {
  if (installed) return;
  installed = true;

  // React Native exposes ErrorUtils on the global. It's not in the standard
  // RN type definitions, so we bridge through `unknown`.
  const ErrorUtils = (globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  }).ErrorUtils;

  if (!ErrorUtils) return;

  const previousHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Persist before doing anything else — this survives the process if it
    // does eventually go down.
    const stored: StoredError = {
      message: error?.message ?? 'Unknown error',
      stack: error?.stack ?? null,
      isFatal: !!isFatal,
      timestamp: new Date().toISOString(),
    };
    AsyncStorage.setItem(LAST_ERROR_KEY, JSON.stringify(stored)).catch(() => {
      // Storage may itself be the failure — ignore.
    });

    // Forward to Sentry for cloud crash reporting. No-op if SENTRY_DSN unset.
    captureException(error, { isFatal: !!isFatal, source: 'globalHandler' });

    // Always forward to the previous handler in non-fatal mode so RN's
    // dev red-box still shows in development. In production, RN's default
    // handler aborts on fatal — we override that by passing isFatal=false.
    try {
      previousHandler(error, false);
    } catch {
      // Previous handler itself threw — swallow. We chose containment over
      // strict correctness here.
    }
  });

  // Also catch unhandled promise rejections. RN already does this on newer
  // versions but the behavior varies, so install a defensive handler.
  if (typeof process !== 'undefined' && process.on) {
    process.on('unhandledRejection', (reason: unknown) => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      const stored: StoredError = {
        message: `[unhandledRejection] ${err.message}`,
        stack: err.stack ?? null,
        isFatal: false,
        timestamp: new Date().toISOString(),
      };
      AsyncStorage.setItem(LAST_ERROR_KEY, JSON.stringify(stored)).catch(() => {});
      captureException(err, { source: 'unhandledRejection' });
    });
  }
}

export async function getLastError(): Promise<StoredError | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredError;
  } catch {
    return null;
  }
}

export async function clearLastError(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ERROR_KEY);
  } catch {
    // ignore
  }
}
