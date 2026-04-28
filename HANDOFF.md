# LuckyDay Handoff

Last updated: 2026-04-28

## Project Summary

LuckyDay is a local-first Expo React Native MVP for a daily luck guide inspired by Thai/Asian-style luck beliefs, Chinese zodiac, lucky colors, lucky numbers, good/bad times, and simple daily advice.

The product direction is intentionally not a generic horoscope app. The MVP is template-based and cheap to run:
- no account creation
- no payments
- no AI calls on app open
- no web search
- no remote photo upload yet
- no Supabase Auth yet

GitHub repo:
https://github.com/sonnymay/LuckyDay

Current branch:
`main`

Latest pushed work:
`Track photo update metadata` (see `git log -1` for the exact commit hash)

## Current App Behavior

First launch:
1. Shows a daily preview with a luck-energy score orb, lucky color swatch, lucky number, lucky time, lucky direction, and simple daily guidance.
2. Asks if the user wants a personal LuckyDay.
3. Opens onboarding.
4. Onboarding is split into 3 steps with a progress indicator:
   - Step 1: nickname, birthday, optional birth time, optional birthplace
   - Step 2: main focuses and optional notification time
   - Step 3: optional photos and local photo privacy consent
5. User selects one or more Main focuses. They can select all:
   - Money
   - Love
   - Work
   - Health
   - Luck
6. User can optionally add photos. If they save photos, they should accept local photo privacy consent.
7. Optional photo cards show `Optional` until captured, then `Captured` with an updated date:
   - face
   - left palm
   - right palm
   - handwriting
8. Profile is saved locally with AsyncStorage.
9. Future opens go straight to Home.

Main screens:
- `app/index.tsx`: welcome/daily preview
- `app/onboarding.tsx`: stepped local profile setup, multi-focus chips, optional media consent, optional photo capture
- `app/home.tsx`: daily score, summary, and share-card save/share action
- `app/detail.tsx`: money/love/work/health/warning/action detail
- `app/feedback.tsx`: local rating and tags
- `app/settings.tsx`: edit nickname, birthday, multi-focuses, notification time, retake/remove photos, privacy controls, reset profile

## Important Implementation Notes

Profile shape is defined in `src/types.ts`.

`mainFocus` is now `MainFocus[]`, not a string. Older local profiles may still have a single string from earlier builds, so `normalizeMainFocuses` in `src/lib/luck.ts` keeps compatibility.

Daily reading logic lives in `src/lib/luck.ts`.

Storage lives in `src/lib/storage.ts`.

Supabase is future-ready only:
- `src/lib/supabase.ts` creates a client only if env vars exist.
- `supabase/schema.sql` includes future tables and `main_focus text[]`.
- No login or cloud sync is active in the MVP.

Photo capture:
- `src/components/ProfilePhotoCapture.tsx`
- Uses `expo-image-picker`.
- Stores local image URIs in AsyncStorage profile data.
- Shows `Optional` / `Captured` status.
- Supports retake and remove actions when a photo already exists.
- Stores optional `photoTimestamps` on the profile for last-updated display.
- Handwriting prompt is currently: `Today I choose steady luck.`
- Native camera flow still needs physical-device or simulator testing.

Visual/product direction:
- The first screen now uses a more feminine premium palette: blush, mauve, rose-gold accents, champagne, and pearl-style panels.
- The old plain score card was replaced with `EnergyScoreCard`, which leads with the daily message and presents the number as `luck energy` inside a score-based gold segmented halo.
- Lucky color, number, time, and direction are now visible as metric cards on the landing page and Home.
- Lucky color uses a real swatch and short meaning copy via `src/lib/luckyColor.ts`.
- Lucky number uses a larger gold display treatment, and direction includes an arrow glyph.
- The score halo uses bright gold active dots and faded inactive dots so the ring reads as a score, not just decoration.
- Landing/Home guidance cards now use the champagne/rose-gold treatment for visual continuity.
- Primary CTA buttons use a warm gold treatment.
- Home includes a 9:16 `LuckyShareCard` capture flow. It uses `react-native-view-shot` to render a local PNG, `expo-media-library` to save it to photos, and `expo-sharing` to offer the native share sheet after save.
- The share card intentionally omits PII: no nickname, birthday, birth time, or photos.
- Web falls back to a text share because camera roll save/share-image behavior is native-only.
- Consumer-facing copy should avoid internal terms like `MVP`; keep developer/product notes in docs only.

Consent:
- `src/components/MediaConsentCard.tsx`
- Required only when optional photos are saved.
- Says photos stay on-device for the MVP.

Privacy controls:
- Settings has a `Privacy controls` card.
- `Clear feedback` deletes local accuracy ratings and tags only.
- `Delete photos only` clears saved photo links and photo timestamps while keeping profile details and feedback.
- `Delete all local data` clears profile, photo URIs, and feedback, then returns to welcome.
- Storage helpers are in `src/lib/storage.ts`: `resetStoredFeedback` and `resetAllStoredData`.
- Settings now warns that AsyncStorage is local but not encrypted.

Local reminders:
- `src/lib/notifications.ts` validates `HH:mm` reminder times, requests notification permission only when a time is present, cancels the previous LuckyDay reminder, and schedules one daily local notification.
- Onboarding Step 2 and Settings label this as `Morning reminder optional`.
- Clearing notification time disables the stored reminder.
- Reset profile and Delete all local data also cancel the stored reminder.
- Web returns an unsupported/no-op result for reminder scheduling; native behavior still needs device testing.

## Commands

Install:

```sh
npm install
```

Run Expo:

```sh
npm start -- --port 8081
```

Typecheck:

```sh
npm run typecheck
```

Unit tests:

```sh
npm test
```

Browser smoke tests:

```sh
npm run e2e
```

Web export:

```sh
npm run export:web
```

## Verification Status

Last verified on 2026-04-28 after local reminder wiring:
- `npm run typecheck` passed
- `npm test` passed: 7 tests
- `npm run export:web` passed
- `npm run e2e` passed: 3 browser smoke tests

E2E note:
- `npm run e2e` now includes 3 browser smoke tests, including onboarding without photos.
- The browser smoke tests use exact text matches where screen copy repeats terms like `Remove` or `Your profile`.
- In the Codex sandbox, `npm run e2e` requires permission to bind a localhost server.

Known verification gap:
- Native camera capture has not been tested on a physical iOS/Android device.
- The e2e setup exports web to `dist` and serves it with `e2e/static-server.js`; it does not validate native camera behavior.
- Native share-card saving and share-sheet behavior still need physical iOS/Android testing, especially camera roll permission, image sharpness, and Instagram/LINE/WhatsApp handoff behavior.
- Local notification permission, scheduling, delivery timing, and cancellation need physical iOS/Android testing.

## Current Risks

- Face, palm, and handwriting photos are sensitive. Keep them local until the app has explicit auth, storage policies, deletion controls, and clear consent.
- AsyncStorage is not encrypted. If the product keeps sensitive media long-term, consider secure storage/file handling and clear user deletion controls.
- Supabase schema is present but not wired to the app. Do not assume remote persistence exists.
- Push notifications are not active. `expo-notifications` helper exists for later local reminders.
- `npm audit` previously reported moderate dependency advisories in the Expo dependency tree.

## Recommended Next Steps

1. Test the full onboarding flow on a real phone with Expo Go.
   - Verify onboarding can finish without any photos.
   - Verify each setup step fits comfortably on small iPhone and Android screens.
   - Verify each capture works.
   - Verify front camera is used for face.
   - Verify photo previews persist after app restart.
   - Verify Settings retake works.
   - Verify `Share today's luck` saves a sharp 9:16 image to Photos and can hand off to Instagram/LINE/WhatsApp.
   - Verify the morning reminder permission prompt, daily delivery, time changes, and disable/reset behavior.

2. Improve photo/privacy UX further.
   - Add a dedicated “Photos and privacy” screen if Settings gets too long.
   - Consider moving sensitive image files out of plain AsyncStorage URI-only handling before production.
   - Add explicit export/delete copy for future cloud sync.

3. Improve the daily reading model.
   - Make multi-focus readings more visibly reflect all selected focuses.
   - Add Thai day-of-week color traditions.
   - Add more template variety without AI.

4. Improve the notification habit loop.
   - Add better reminder copy variants.
   - Consider an in-app preview of the notification teaser.
   - Verify delivery on real devices before App Store screenshots.

5. Prepare future Supabase sync carefully.
   - Add Auth only when explicitly needed.
   - Add Storage buckets and RLS policies before uploading photos.
   - Add deletion policies before any upload feature.

## Files To Inspect First

- `CLAUDE.md`: coding behavior guidance
- `README.md`: basic project overview
- `src/types.ts`: data model
- `src/lib/luck.ts`: daily reading generator
- `app/onboarding.tsx`: first-time flow
- `app/settings.tsx`: profile editing and photo retake
- `supabase/schema.sql`: future database structure
- `src/lib/luck.test.ts`: unit test coverage
- `e2e/luckyday.spec.ts`: browser smoke tests

## Commit Protocol

This repo follows the Lore commit protocol described in the workspace instructions. Commit messages should explain why, include relevant constraints/rejected alternatives, and list tested/not-tested evidence.
