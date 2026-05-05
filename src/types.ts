export type MainFocus = 'Money' | 'Love' | 'Work' | 'Health' | 'Luck';

export type ProfilePhotos = {
  faceUri: string;
  leftPalmUri: string;
  rightPalmUri: string;
  handwritingUri: string;
};

export type ProfilePhotoTimestamps = {
  faceUpdatedAt?: string;
  leftPalmUpdatedAt?: string;
  rightPalmUpdatedAt?: string;
  handwritingUpdatedAt?: string;
};

export type Profile = {
  id: string;
  nickname: string;
  birthday: string;
  birthTime?: string;
  birthplace?: string;
  mainFocus: MainFocus[];
  notificationTime?: string;
  westernZodiac: string;
  chineseZodiac: string;
  photos: ProfilePhotos;
  photoTimestamps?: ProfilePhotoTimestamps;
  mediaConsentAt: string;
  createdAt: string;
};

export type ProfileInput = {
  nickname: string;
  birthday: string;
  birthTime?: string;
  birthplace?: string;
  mainFocus: MainFocus[];
  notificationTime?: string;
  photos: ProfilePhotos;
  photoTimestamps?: ProfilePhotoTimestamps;
  mediaConsentAt?: string;
};

export type DailyReading = {
  date: string;
  score: number;
  mainMessage: string;
  fortuneQuote: string;
  goodFor: string[];
  avoid: string[];
  /** Lunar calendar date, e.g. "三月初三" — from real almanac data */
  lunarDate: string;
  /** Bilingual solar term if today is one of the 24 节气, e.g. "谷雨 · Grain Rain" */
  solarTerm: string | undefined;
  luckyNumber: number;
  luckyColor: string;
  luckyTime: string;
  luckyDirection: string;
  moonPhase: string;
  moonMessage: string;
  chineseZodiac: string;
  zodiacElement: string;
  westernZodiac: string;
  /** Daily insight from Chinese zodiac animal */
  zodiacInsight: string;
  /** Daily insight from Western zodiac sign */
  westernZodiacInsight: string;
  money: string;
  love: string;
  work: string;
  health: string;
  warning: string;
  action: string;
  /** One-sentence explanation of why the score is what it is today */
  scoreReason: string;
  /** Score component: personal zodiac + date base (50–80) */
  scoreBase: number;
  /** Score component: moon phase bonus (0–8) */
  scoreMoonBonus: number;
  /** Score component: almanac auspiciousness bonus (0–5) */
  scoreAlmanacBonus: number;
};

export type FeedbackRating = 'Yes' | 'Somewhat' | 'No';

export type Feedback = {
  id: string;
  date: string;
  rating: FeedbackRating;
  tags: string[];
  createdAt: string;
};
