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
  money: string;
  love: string;
  work: string;
  health: string;
  warning: string;
  action: string;
};

export type FeedbackRating = 'Yes' | 'Somewhat' | 'No';

export type Feedback = {
  id: string;
  date: string;
  rating: FeedbackRating;
  tags: string[];
  createdAt: string;
};
