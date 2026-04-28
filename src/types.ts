export type MainFocus = 'Money' | 'Love' | 'Work' | 'Health' | 'Luck';

export type ProfilePhotos = {
  faceUri: string;
  leftPalmUri: string;
  rightPalmUri: string;
  handwritingUri: string;
};

export type Profile = {
  id: string;
  nickname: string;
  birthday: string;
  birthTime?: string;
  birthplace?: string;
  mainFocus: MainFocus;
  notificationTime?: string;
  westernZodiac: string;
  chineseZodiac: string;
  photos: ProfilePhotos;
  mediaConsentAt: string;
  createdAt: string;
};

export type ProfileInput = {
  nickname: string;
  birthday: string;
  birthTime?: string;
  birthplace?: string;
  mainFocus: MainFocus;
  notificationTime?: string;
  photos: ProfilePhotos;
  mediaConsentAt?: string;
};

export type DailyReading = {
  date: string;
  score: number;
  mainMessage: string;
  goodFor: string[];
  avoid: string[];
  luckyNumber: number;
  luckyColor: string;
  luckyTime: string;
  luckyDirection: string;
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
