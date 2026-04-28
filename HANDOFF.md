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

Latest pushed commit:
`fffedbb Allow multiple daily focus selections`

## Current App Behavior

First launch:
1. Shows a sample daily reading.
2. Asks if the user wants a personal LuckyDay.
3. Opens onboarding.
4. User enters profile fields.
5. User selects one or more Main focuses. They can select all:
   - Money
   - Love
   - Work
   - Health
   - Luck
6. User must accept local photo privacy consent.
7. User must capture:
   - face
   - left palm
   - right palm
   - handwriting
8. Profile is saved locally with AsyncStorage.
9. Future opens go straight to Home.

Main screens:
- `app/index.tsx`: welcome/sample reading
- `app/onboarding.tsx`: local profile setup, multi-focus chips, media consent, photo capture
- `app/home.tsx`: daily score and summary
- `app/detail.tsx`: money/love/work/health/warning/action detail
- `app/feedback.tsx`: local rating and tags
- `app/settings.tsx`: edit nickname, birthday, multi-focuses, notification time, retake photos, reset profile

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
- Native camera flow still needs physical-device or simulator testing.

Consent:
- `src/components/MediaConsentCard.tsx`
- Required before onboarding profile save.
- Says photos stay on-device for the MVP.

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

Last verified after multi-focus change:
- `npm run typecheck` passed
- `npm test` passed: 7 tests
- `npm run e2e` passed: 2 browser smoke tests

Known verification gap:
- Native camera capture has not been tested on a physical iOS/Android device.

Note: In the Codex sandbox, `npm run e2e` required permission to bind a localhost server. The e2e setup exports web to `dist` and serves it with `e2e/static-server.js`.

## Current Risks

- Face, palm, and handwriting photos are sensitive. Keep them local until the app has explicit auth, storage policies, deletion controls, and clear consent.
- AsyncStorage is not encrypted. If the product keeps sensitive media long-term, consider secure storage/file handling and clear user deletion controls.
- Supabase schema is present but not wired to the app. Do not assume remote persistence exists.
- Push notifications are not active. `expo-notifications` helper exists for later local reminders.
- `npm audit` previously reported moderate dependency advisories in the Expo dependency tree.

## Recommended Next Steps

1. Test the full onboarding camera flow on a real phone with Expo Go.
   - Verify each capture works.
   - Verify front camera is used for face.
   - Verify photo previews persist after app restart.
   - Verify Settings retake works.

2. Add a better photo management UX.
   - Show capture completion status.
   - Add remove/retake confirmation.
   - Add clearer guidance for handwriting sample text.

3. Add a privacy/settings section.
   - Explain local storage.
   - Add “delete photos only”.
   - Add “export/delete all local data”.

4. Improve the daily reading model.
   - Make multi-focus readings more visibly reflect all selected focuses.
   - Add Thai day-of-week color traditions.
   - Add more template variety without AI.

5. Add a lightweight local notification MVP.
   - Do not request permission during onboarding.
   - Let user enable reminders from Settings.
   - Use local notifications only.

6. Prepare future Supabase sync carefully.
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
