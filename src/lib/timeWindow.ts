/**
 * Live progress tracker for a "best time" window such as "6 AM - 8 AM".
 *
 * Window strings are produced by src/lib/luck.ts (constant luckyTimes).
 * Format is strict: `<H> <AM|PM> - <H> <AM|PM>` (e.g. "10 AM - 12 PM").
 * Parsing returns null for any malformed input so the UI degrades to a
 * static label rather than throwing.
 */

export interface ParsedWindow {
  /** Hour-of-day in 0-23 for the start of the window. */
  startHour: number;
  /** Hour-of-day in 0-23 for the end of the window. */
  endHour: number;
}

export type WindowState =
  | { state: 'before'; minutesUntilStart: number }
  | { state: 'active'; progress: number /** 0-1 */ }
  | { state: 'after'; minutesSinceEnd: number };

const WINDOW_REGEX = /^(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)$/i;

function toHour24(hour12: number, ampm: string): number | null {
  if (hour12 < 1 || hour12 > 12) return null;
  const upper = ampm.toUpperCase();
  if (upper === 'AM') return hour12 === 12 ? 0 : hour12;
  if (upper === 'PM') return hour12 === 12 ? 12 : hour12 + 12;
  return null;
}

export function parseTimeWindow(input: string): ParsedWindow | null {
  const match = WINDOW_REGEX.exec(input.trim());
  if (!match) return null;
  const startHour = toHour24(Number(match[1]), match[2]);
  const endHour = toHour24(Number(match[3]), match[4]);
  if (startHour === null || endHour === null) return null;
  if (endHour <= startHour) return null;
  return { startHour, endHour };
}

/**
 * Returns the user-facing state of the time window relative to `now`.
 *
 * `now` is injected to keep the function pure and testable.
 */
export function getWindowState(parsed: ParsedWindow, now: Date): WindowState {
  const startMinutes = parsed.startHour * 60;
  const endMinutes = parsed.endHour * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < startMinutes) {
    return { state: 'before', minutesUntilStart: startMinutes - nowMinutes };
  }
  if (nowMinutes >= endMinutes) {
    return { state: 'after', minutesSinceEnd: nowMinutes - endMinutes };
  }
  const span = endMinutes - startMinutes;
  const elapsed = nowMinutes - startMinutes;
  return { state: 'active', progress: elapsed / span };
}

/**
 * Compact human label for the window state. Used under the "Best time" value.
 * Returns null for an active window — the UI shows a progress bar instead.
 */
export function formatWindowHint(state: WindowState): string | null {
  if (state.state === 'active') return null;
  const minutes = state.state === 'before' ? state.minutesUntilStart : state.minutesSinceEnd;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const piece = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return state.state === 'before' ? `Starts in ${piece}` : `Ended ${piece} ago`;
}
