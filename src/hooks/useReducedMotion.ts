import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Tracks the iOS Reduce Motion accessibility setting.
 *
 * Components that run sparkle / halo / spring animations should consult this
 * hook and either skip the animation entirely or snap to the final value
 * immediately. The screen still works without animation — the value just
 * appears in place rather than tweening in.
 *
 * On web (where the user might use the Expo web export) AccessibilityInfo
 * is missing the listener API, so we just read once on mount and never
 * update — close enough.
 */
export function useReducedMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!cancelled) setEnabled(Boolean(value));
      })
      .catch(() => undefined);

    if (Platform.OS === 'web') {
      return () => {
        cancelled = true;
      };
    }

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setEnabled(Boolean(value));
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return enabled;
}
