import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feedback, Profile } from '../types';

const PROFILE_KEY = 'luckyday.profile.v1';
const FEEDBACK_KEY = 'luckyday.feedback.v1';

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
