import { describe, expect, it } from 'vitest';
import { STREAK_MILESTONES, selectMilestoneToShow } from './milestones';

describe('selectMilestoneToShow', () => {
  it('returns null when streak is below first milestone', () => {
    expect(selectMilestoneToShow(2, [])).toBeNull();
  });

  it('returns the 3-day milestone for a fresh user at 3 days', () => {
    const m = selectMilestoneToShow(3, []);
    expect(m?.days).toBe(3);
  });

  it('returns the highest unseen milestone the user already qualifies for', () => {
    // User installed late, imported history showing a 40-day streak,
    // hasn't seen any milestone yet. Show the 30-day milestone.
    const m = selectMilestoneToShow(40, []);
    expect(m?.days).toBe(30);
  });

  it('skips already-seen milestones', () => {
    const m = selectMilestoneToShow(7, [3, 7]);
    expect(m).toBeNull();
  });

  it('shows the next unseen milestone when user has seen previous ones', () => {
    // Streak 14, has seen 3 and 7. Should now show 14.
    const m = selectMilestoneToShow(14, [3, 7]);
    expect(m?.days).toBe(14);
  });

  it('every milestone has a non-empty title and body', () => {
    for (const m of STREAK_MILESTONES) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.body.length).toBeGreaterThan(0);
    }
  });

  it('milestones are sorted ascending by days', () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i].days).toBeGreaterThan(STREAK_MILESTONES[i - 1].days);
    }
  });
});
