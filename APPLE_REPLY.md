Hello App Review Team,

Thank you for the detailed feedback on submission c340f30c. I would like to address both points respectfully.

## Guideline 4.3(b) — Saturated Category

We understand the concern about saturation in horoscope/fortune-telling apps. We want to clarify that LuckyDay is built around a different core, and we are updating our App Store metadata in this submission to make that clearer:

1. **Real Chinese Almanac (黄历) integration.** The app is built on the traditional Chinese Almanac, a 4,000-year-old cultural and agricultural calendar system used across East Asia. Each day surfaces the actual almanac's recommendations for what activities the day favors (宜) and which to be cautious of (忌). This is calendar/cultural reference data, not generated "predictions."

2. **24 solar terms + lunar phase as primary reference.** We compute the current solar term (立春, 立夏, etc.) and moon phase from astronomical data and present them as cultural/temporal context. This is closer in spirit to a lunar calendar utility than a fortune-telling app.

3. **Action-oriented daily ritual, not predictions.** The app does not predict the user's day. It surfaces a small, concrete morning intention rooted in the almanac's guidance ("write a thank-you note", "tidy your desk before 10am", etc.). The user reflects in the evening and tracks patterns over time — this is closer to a journaling/habit-tracking app than a horoscope app.

4. **No premium "psychic readings" or paid predictions.** Premium unlocks deeper journaling/history features. There are no tarot reads, palm reads, compatibility matchings, or "psychic" content.

5. **Privacy-first, local-only.** All user data stays on device. There is no social/match-making feature, no astrologer marketplace, no chatbot — all of which characterize the saturated category Apple is concerned about.

We are immediately updating the App Subtitle, Promotional Text, Description, and Keywords in this submission to reflect this positioning more accurately (Chinese Almanac & Lunar Calendar Companion, not "luck reading").

## Guideline 2.1(a) — iPad Crash

We have not yet been able to reproduce the iPad Air 11-inch M3 / iPadOS 26.4.2 crash on our test devices. Build 13 declared `supportsTablet: false` in app.json to route review to iPhone, where the app has launched cleanly across 13 prior builds; we recognize from this rejection that the reviewer still tested on iPad (in iPhone-compat mode) and crashed.

We are committed to fixing this. In our next build we will:
- Upgrade to Expo SDK 55 (iPadOS 26 support)
- Acquire an iPad Air M3 for device-side reproduction
- Enable Sentry crash reporting with a real DSN so the symbolicated stack trace is available to us

We respectfully ask App Review to consider the differentiation points above for the 4.3(b) finding while we work on the crash fix for the next submission.

Thank you for your time.

— Santipap May, LuckyDay
