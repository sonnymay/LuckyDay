import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyReading, Feedback, Profile } from '../types';

const PROFILE_KEY = 'luckyday.profile.v1';
const FEEDBACK_KEY = 'luckyday.feedback.v1';
const READING_HISTORY_KEY = 'luckyday.readingHistory.v1';
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
  await AsyncStorage.multiRemove([PROFILE_KEY, FEEDBACK_KEY, READING_HISTORY_KEY]);
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
