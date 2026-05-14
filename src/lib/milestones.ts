/**
 * Streak milestones worth celebrating.
 *
 * Each milestone is paired with a short lunar/almanac-flavored line shown in the
 * MilestoneModal. Lines stay grounded — no superlatives, no exclamation marks
 * unless earned — matching the reading-soul audit rubric.
 */

export interface Milestone {
  /** Day count that triggers the celebration. */
  days: number;
  /** Headline shown at the top of the modal. */
  title: string;
  /** One- to two-sentence body grounded in Chinese cultural imagery. */
  body: string;
}

export const STREAK_MILESTONES: Milestone[] = [
  {
    days: 3,
    title: 'Three days in a row.',
    body: "Three is the moon's first quarter — momentum, not yet a habit. Keep the small ritual.",
  },
  {
    days: 7,
    title: 'A full week.',
    body: 'Seven days closes a lunar phase. What you returned to for a week, you can return to for a month.',
  },
  {
    days: 14,
    title: 'Two weeks steady.',
    body: 'Half a lunar cycle. The almanac is becoming familiar — notice what you reach for first now.',
  },
  {
    days: 30,
    title: 'A full lunar cycle.',
    body: "Thirty days. You have walked one complete moon. This is no longer a streak — it is a rhythm.",
  },
  {
    days: 60,
    title: 'Sixty days. Two cycles.',
    body: 'Wood roots in the second cycle. What started as curiosity is now part of how you start a morning.',
  },
  {
    days: 100,
    title: 'One hundred days.',
    body: 'A hundred days of small ritual. In old Chinese calendars, the hundredth day is when a foundation is considered set.',
  },
  {
    days: 365,
    title: 'A full year of almanacs.',
    body: 'Every solar term. Every lunar phase. You have walked through all of them. The seasons are yours now.',
  },
];

/**
 * Returns the most-recent milestone the user has now qualified for AND has
 * not yet seen. Returns null if no new milestone applies.
 *
 * Reading the largest unseen milestone (not the smallest) handles the edge
 * case where a user installs the app late and imports a long history.
 */
export function selectMilestoneToShow(
  currentStreak: number,
  seen: number[],
): Milestone | null {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    const m = STREAK_MILESTONES[i];
    if (currentStreak >= m.days && !seen.includes(m.days)) return m;
  }
  return null;
}
