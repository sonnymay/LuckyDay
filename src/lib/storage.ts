import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyReading, Feedback, Profile } from '../types';

const PROFILE_KEY = 'luckyday.profile.v1';
const FEEDBACK_KEY = 'luckyday.feedback.v1';
const READING_HISTORY_KEY = 'luckyday.readingHistory.v1';
const HAS_SEEN_PAYWALL_KEY = 'luckyday.hasSeenPaywall.v1';
const LAST_NOTIFICATION_DATE_KEY = 'luckyday.lastNotificationDate.v1';
const MILESTONES_SEEN_KEY = 'luckyday.milestonesSeen.v1';
const JOURNAL_KEY = 'luckyday.journal.v1';
const RITUAL_DONE_KEY = 'luckyday.ritualDone.v1';
const COACH_SEEN_KEY = 'luckyday.coachSeen.v1';
const MAX_READING_HISTORY_ITEMS = 30;

export async function getStoredProfile() {
  const value = await AsyncStorage.getItem(PROFILE_KEY);
  return value ? (JSON.parse(value) as Profile) : null;
}

export async function saveStoredProfile(profile: Profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function resetStoredProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}

export async function resetStoredFeedback() {
  await AsyncStorage.removeItem(FEEDBACK_KEY);
}

export async function resetAllStoredData() {
  await AsyncStorage.multiRemove([PROFILE_KEY, FEEDBACK_KEY, READING_HISTORY_KEY, HAS_SEEN_PAYWALL_KEY]);
}

export async function getStoredFeedback() {
  const value = await AsyncStorage.getItem(FEEDBACK_KEY);
  return value ? (JSON.parse(value) as Feedback[]) : [];
}

export async function saveFeedback(feedback: Feedback) {
  const items = await getStoredFeedback();
  const next = [feedback, ...items.filter((item) => item.date !== feedback.date)];
  await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
}

export async function getFeedbackForDate(date: string) {
  const items = await getStoredFeedback();
  return items.find((item) => item.date === date) ?? null;
}

export async function getStoredReadingHistory() {
  const value = await AsyncStorage.getItem(READING_HISTORY_KEY);
  return value ? (JSON.parse(value) as DailyReading[]) : [];
}

export async function saveReadingHistoryItem(reading: DailyReading) {
  const items = await getStoredReadingHistory();
  const next = [reading, ...items.filter((item) => item.date !== reading.date)].slice(0, MAX_READING_HISTORY_ITEMS);
  await AsyncStorage.setItem(READING_HISTORY_KEY, JSON.stringify(next));
}

export async function resetStoredReadingHistory() {
  await AsyncStorage.removeItem(READING_HISTORY_KEY);
}

export async function getHasSeenPaywall(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAS_SEEN_PAYWALL_KEY);
  return value === 'true';
}

export async function setHasSeenPaywall(): Promise<void> {
  await AsyncStorage.setItem(HAS_SEEN_PAYWALL_KEY, 'true');
}

/** Returns true if the notification has NOT yet been scheduled today. */
export async function shouldScheduleNotificationToday(todayKey: string): Promise<boolean> {
  const last = await AsyncStorage.getItem(LAST_NOTIFICATION_DATE_KEY);
  return last !== todayKey;
}

export async function setNotificationScheduledToday(todayKey: string): Promise<void> {
  await AsyncStorage.setItem(LAST_NOTIFICATION_DATE_KEY, todayKey);
}

/**
 * Returns the list of streak milestones the user has already been celebrated for.
 * Used so each milestone modal appears exactly once across all sessions.
 */
export async function getSeenMilestones(): Promise<number[]> {
  const value = await AsyncStorage.getItem(MILESTONES_SEEN_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export async function markMilestoneSeen(milestone: number): Promise<void> {
  const seen = await getSeenMilestones();
  if (seen.includes(milestone)) return;
  const next = [...seen, milestone];
  await AsyncStorage.setItem(MILESTONES_SEEN_KEY, JSON.stringify(next));
}

/**
 * Daily journal — single optional text entry per date. Keyed by date so a
 * user can revisit a past day and see what they wrote. Personal artifacts
 * are the strongest churn defense: users don't delete an app that holds
 * their own words.
 */
type JournalMap = Record<string, string>;

async function getJournalMap(): Promise<JournalMap> {
  const value = await AsyncStorage.getItem(JOURNAL_KEY);
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as JournalMap) : {};
  } catch {
    return {};
  }
}

export async function getJournalEntry(date: string): Promise<string> {
  const map = await getJournalMap();
  return map[date] ?? '';
}

export async function setJournalEntry(date: string, text: string): Promise<void> {
  const map = await getJournalMap();
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    delete map[date];
  } else {
    map[date] = trimmed;
  }
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(map));
}

export async function getAllJournalEntries(): Promise<JournalMap> {
  return getJournalMap();
}

/**
 * Ritual completion — closes the loop the app otherwise dangles open
 * (we tell users to do something each day; we should ask if they did).
 * Stored as a date→bool map so a user revisiting the past sees the state.
 */
type RitualDoneMap = Record<string, boolean>;

async function getRitualDoneMap(): Promise<RitualDoneMap> {
  const value = await AsyncStorage.getItem(RITUAL_DONE_KEY);
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as RitualDoneMap) : {};
  } catch {
    return {};
  }
}

export async function getRitualDone(date: string): Promise<boolean> {
  const map = await getRitualDoneMap();
  return map[date] === true;
}

export async function setRitualDone(date: string, done: boolean): Promise<void> {
  const map = await getRitualDoneMap();
  if (done) {
    map[date] = true;
  } else {
    delete map[date];
  }
  await AsyncStorage.setItem(RITUAL_DONE_KEY, JSON.stringify(map));
}

export async function getAllRitualDone(): Promise<RitualDoneMap> {
  return getRitualDoneMap();
}

/**
 * First-time orientation coach card. Set once on dismiss; never shown again.
 * Used by /detail to show a one-time "what this app is" panel for cold users.
 */
export async function getCoachSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(COACH_SEEN_KEY);
  return value === 'true';
}

export async function setCoachSeen(): Promise<void> {
  await AsyncStorage.setItem(COACH_SEEN_KEY, 'true');
}
