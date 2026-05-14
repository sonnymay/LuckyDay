/**
 * Auspicious-day (黃道吉日) detection.
 *
 * The traditional Chinese almanac assigns one of 12 day-gods to each day.
 * Six are auspicious ("yellow path", 黄道) and six are inauspicious
 * ("dark path", 黑道). This module exposes a small helper that surfaces
 * ONLY the auspicious days, so the UI can show a positive badge without
 * ever telling a user "today is bad."
 *
 * All display strings are English. The Chinese names are used internally
 * to match the raw lunar-javascript library output.
 */

import Lunar from 'lunar-javascript';

export interface AuspiciousDay {
  /** English name of the day-god, e.g. "Green Dragon". */
  name: string;
  /** One-line plain-English meaning for the day. */
  meaning: string;
}

/**
 * The 6 auspicious day-gods (黄道日). Keys are the Chinese names returned by
 * `lunar.getDayTianShen()`; values are the English display + meaning.
 *
 * Order roughly follows their traditional rank from most active to most
 * subtle, which is also how the meanings are written.
 */
const AUSPICIOUS_DAY_GODS: Record<string, AuspiciousDay> = {
  '青龙': { name: 'Green Dragon', meaning: 'Bold moves are favored. Start, ask, propose.' },
  '明堂': { name: 'Bright Hall', meaning: 'Visibility helps you. Show your work, speak up.' },
  '金匮': { name: 'Golden Vault', meaning: 'Money and steady gains. Good day to plan finances.' },
  '天德': { name: 'Heavenly Virtue', meaning: 'Kindness multiplies. Help, give, mend a relationship.' },
  '玉堂': { name: 'Jade Hall', meaning: 'Beauty and study. Refine, learn, polish your craft.' },
  '司命': { name: 'Master of Destiny', meaning: 'Decisions stick today. Choose with care.' },
};

/**
 * Returns the auspicious-day info if today qualifies as one of the 6 黄道日,
 * otherwise null. Returns null on library failure as well — the badge is a
 * delight, not a critical feature, so silent fallback is correct.
 */
export function getAuspiciousDay(date: Date): AuspiciousDay | null {
  try {
    const solar = Lunar.Solar.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
    const lunar = solar.getLunar();
    const tianShen = lunar.getDayTianShen();
    return AUSPICIOUS_DAY_GODS[tianShen] ?? null;
  } catch {
    return null;
  }
}

/** Compact label for the badge. Returns null if not auspicious. */
export function formatAuspiciousBadgeLabel(info: AuspiciousDay | null): string | null {
  if (!info) return null;
  return `Auspicious day · ${info.name}`;
}
