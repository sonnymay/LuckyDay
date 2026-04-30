# LuckyDay Handoff

Last updated: 2026-04-29 (UI polish pass verified)

## Project Summary

LuckyDay is a local-first Expo React Native MVP for a daily luck guide inspired by Asian-style luck beliefs, Chinese zodiac, lucky colors, lucky numbers, good/bad times, and simple daily advice.

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
`codex-luckyday-product-polish`

Latest pushed work:
`Apply Claude UI polish pass` (see `git log -1` for the exact commit hash)

## Current App Behavior

First launch:
1. Shows a daily preview with a luck-energy score orb, cute Chinese zodiac animal visual, lucky color swatch, lucky number, lucky time, lucky direction, moon energy, and simple daily guidance.
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
- `app/history.tsx`: local reading history
- `app/settings.tsx`: edit nickname, birthday, multi-focuses, notification time, retake/remove photos, privacy controls, reset profile

## Important Implementation Notes

Profile shape is defined in `src/types.ts`.

`mainFocus` is now `MainFocus[]`, not a string. Older local profiles may still have a single string from earlier builds, so `normalizeMainFocuses` in `src/lib/luck.ts` keeps compatibility.

Daily reading logic lives in `src/lib/luck.ts`.
- Readings include a deterministic local moon phase and moon guidance message. No network or calendar API is used.
- Readings include the user's Chinese zodiac animal from the locally saved birthday/profile.
- Cute animal display data lives in `src/lib/chineseZodiac.ts`; the reusable visual component is `src/components/ChineseZodiacCard.tsx`.

Storage lives in `src/lib/storage.ts`.
- Reading history is saved locally in `luckyday.readingHistory.v1`, capped at 30 readings, and keyed by date so a daily reading updates rather than duplicates.
- `src/lib/streak.ts` calculates the current daily ritual streak from local reading history.
- History includes a compact current-month activity grid that marks days with saved readings.
- `Delete all local data` clears profile, feedback, and reading history.

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
- Landing and Home show a cute Chinese zodiac animal card based on the saved birthday-derived animal.
- Lucky color uses a real swatch and short meaning copy via `src/lib/luckyColor.ts`.
- Lucky number uses a larger gold display treatment, and direction includes an arrow glyph.
- The score halo uses bright gold active dots and faded inactive dots so the ring reads as a score, not just decoration.
- Landing/Home guidance cards now use the champagne/rose-gold treatment for visual continuity.
- Primary CTA buttons use a warm gold treatment.
- Home includes a 9:16 `LuckyShareCard` capture flow. It uses `react-native-view-shot` to render a local PNG, `expo-media-library` to save it to photos, and `expo-sharing` to offer the native share sheet after save.
- The share card intentionally omits PII: no nickname, birthday, birth time, or photos.
- The share card includes the moon phase under the date and the Chinese zodiac animal as subtle content-depth cues.
- Web falls back to a text share because camera roll save/share-image behavior is native-only.
- Consumer-facing copy should avoid internal terms like `MVP`; keep developer/product notes in docs only.

UI polish pass (2026-04-29):
- Home screen content reordered: 2×2 lucky metric grid now appears directly after EnergyScoreCard so the hero and its specifics are visible in one scroll without burying them below fold.
- Home streak empty state fixed: shows "Start your ritual today ✨" instead of "0 days ✨" on first visit.
- Home nav buttons replaced with a horizontal 3-column card grid (Daily detail, Reading history, Rate today) with emoji + mauve label — matches the app palette and reads as navigation, not secondary text buttons.
- Feedback screen title changed from "Was today accurate?" to "Did today feel lucky? ✨" — removes A/B-test language.
- Feedback screen now includes a subtitle: "Your rating helps shape future readings." — adds a clear value exchange.
- Feedback rating buttons now show an emoji above the label (🍀/🌙/🌧️) and use mauve selected state to match the app palette.
- Feedback tags label changed to "What was in the energy today?" and selected tags now use mauve background with white text.
- Chinese zodiac tone copy varied across all 12 animals — endings are now qualities/energies/descriptors, no longer all end in "luck".
- Birthday input replaced with `BirthdayPicker` component in both onboarding and settings: three segmented number inputs (YYYY / MM / DD) with numeric keyboard, auto-advance between segments. No new npm packages required.
- Notification time input replaced with `TimePickerInput` component in both onboarding and settings: two segmented inputs (HH / MM) with a "24-hr" badge. No new npm packages required.
- New components: `src/components/BirthdayPicker.tsx`, `src/components/TimePickerInput.tsx`.

Consent:
- `src/components/MediaConsentCard.tsx`
- Required only when optional photos are saved.
- Says photos stay on-device for the MVP.

Privacy controls:
- Settings has a `Privacy controls` card.
- `Clear feedback` deletes local accuracy ratings and tags only.
- `Delete photos only` clears saved photo links and photo timestamps while keeping profile details and feedback.
- `Delete all local data` clears profile, photo URIs, feedback, and reading history, then returns to welcome.
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

## Launch Planning Docs

- `docs/APP_STORE_LAUNCH_BRIEF.md`: App Store positioning, subtitle and keyword ideas, description draft, screenshot order, launch blockers, and monetization direction.
- `docs/REAL_DEVICE_QA.md`: physical-device QA checklist for onboarding, camera/photos, share card, notifications, history, settings, and screenshot readiness.

## Verification Status

Last verified on 2026-04-29 after Claude UI polish pass:
- `npm run typecheck` passed
- `npm test` passed: 12 tests
- `npm run export:web` passed
- `npm run e2e` passed: 3 browser smoke tests
- In-app browser QA passed for Home showing the reordered lucky metric grid, Chinese zodiac card, updated streak/nav area, and hidden share-card render content.
- In-app browser QA passed for Onboarding Step 1 showing the segmented birthday picker.
- Browser console no longer shows project-owned web shadow or `pointerEvents` deprecation warnings after reload. The remaining warning is the expected `expo-notifications` unsupported-on-web listener warning.

Post UI polish pass note:
- The onboarding e2e tests were updated for the segmented birthday picker.
- Real-device QA of BirthdayPicker and TimePickerInput should be prioritized — segmented numeric keyboard behavior on small screens needs physical device confirmation.

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

1. Run the real-device QA checklist in `docs/REAL_DEVICE_QA.md` on at least one iPhone and one Android phone.
   - Verify onboarding can finish without any photos.
   - Verify each setup step fits comfortably on small iPhone and Android screens.
   - Verify each capture works.
   - Verify front camera is used for face.
   - Verify photo previews persist after app restart.
   - Verify Settings retake works.
   - Verify `Share today's luck` saves a sharp 9:16 image to Photos and can hand off to Instagram/LINE/WhatsApp.
   - Verify the morning reminder permission prompt, daily delivery, time changes, and disable/reset behavior.

2. Prepare App Store screenshots using `docs/APP_STORE_LAUNCH_BRIEF.md` and `docs/SCREENSHOT_GUIDE.md`.
   - Capture the daily reveal first.
   - Capture the shareable story card second or third.
   - Avoid screenshots that expose developer copy, placeholder data, or incomplete native permission states.

3. Improve photo/privacy UX further.
   - Add a dedicated “Photos and privacy” screen if Settings gets too long.
   - Consider moving sensitive image files out of plain AsyncStorage URI-only handling before production.
   - Add explicit export/delete copy for future cloud sync.

4. Improve the daily reading model.
   - Make multi-focus readings more visibly reflect all selected focuses.
   - Add more moon/message variety without AI.

5. Improve reading history.
   - Add clearer empty state if history is unavailable.
   - Consider a non-destructive `Clear history` control later with confirmation.
   - Consider previous/next month navigation once history spans multiple months.

6. Improve the notification habit loop.
   - Add better reminder copy variants.
   - Consider an in-app preview of the notification teaser.
   - Verify delivery on real devices before App Store screenshots.

7. Prepare future Supabase sync carefully.
   - Add Auth only when explicitly needed.
   - Add Storage buckets and RLS policies before uploading photos.
   - Add deletion policies before any upload feature.

## Files To Inspect First

- `CLAUDE.md`: coding behavior guidance
- `docs/APP_STORE_LAUNCH_BRIEF.md`: App Store launch positioning and screenshot plan
- `docs/REAL_DEVICE_QA.md`: physical-device QA checklist
- `README.md`: basic project overview
- `src/types.ts`: data model
- `src/lib/luck.ts`: daily reading generator
- `src/lib/chineseZodiac.ts`: zodiac animal display data (emoji + tone)
- `src/components/BirthdayPicker.tsx`: segmented YYYY/MM/DD date input
- `src/components/TimePickerInput.tsx`: segmented HH/MM time input
- `app/onboarding.tsx`: first-time flow
- `app/settings.tsx`: profile editing and photo retake
- `app/feedback.tsx`: daily rating screen
- `supabase/schema.sql`: future database structure
- `src/lib/luck.test.ts`: unit test coverage
- `e2e/luckyday.spec.ts`: browser smoke tests

## Commit Protocol

This repo follows the Lore commit protocol described in the workspace instructions. Commit messages should explain why, include relevant constraints/rejected alternatives, and list tested/not-tested evidence.
