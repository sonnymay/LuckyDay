# LuckyDay Handoff

Last updated: 2026-05-02 (Premium paywall visual polish)

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
`Remove Moon Energy UI` (see `git log -1` for the exact commit hash)

## Current App Behavior

First launch:
1. Shows a daily preview with a luck-energy score orb, cute Chinese zodiac animal visual, lucky color swatch, lucky number, lucky time, lucky direction, Chinese almanac guidance, and simple daily advice.
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
- Moon data is still generated internally for backward-compatible saved readings, but Moon Energy is no longer shown in the visible product experience.
- Readings include the user's Chinese zodiac animal from the locally saved birthday/profile.
- Chinese zodiac assignment now respects Lunar New Year boundaries for supported birth years, so January and early-February birthdays do not get the wrong animal by simple Gregorian year.
- Core daily luck stays deterministic/local for privacy, speed, and consistency. Future AI/API work should be reserved for premium deeper readings, especially optional photo-based interpretation with explicit consent.
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
- `EnergyScoreCard` now has a softer message panel, champagne label pill, sparkle/floral accents, an orb glow, and a small energy mood label so the score feels like a reveal rather than a grade.
- Lucky color, number, time, and direction are now visible as metric cards on the landing page and Home.
- Landing and Home show a cute Chinese zodiac animal card based on the saved birthday-derived animal.
- Lucky color uses a real swatch and short meaning copy via `src/lib/luckyColor.ts`.
- Lucky number uses a larger gold display treatment, and direction includes an arrow glyph.
- `LuckyMetricCard` now styles each first-viewport metric as a mini fortune object: decorative accents, framed color swatch, gold number treatment, direction badge, and short context copy for time/direction.
- The score halo uses bright gold active dots and faded inactive dots so the ring reads as a score, not just decoration.
- Landing/Home guidance cards now use the champagne/rose-gold treatment for visual continuity.
- Primary CTA buttons use a warm gold treatment.
- Home includes a 9:16 `LuckyShareCard` capture flow. It uses `react-native-view-shot` to render a local PNG, `expo-media-library` to save it to photos, and `expo-sharing` to offer the native share sheet after save.
- Home now includes a "Send a little luck" prompt before the share button to make sharing feel like a cute social ritual instead of a utility action. The prompt uses the lucky color meaning to suggest sending the card to someone who could use that energy today.
- The share prompt includes a tiny story-card preview so the share action feels visual and desirable before the user taps it.
- The share card intentionally omits PII: no nickname, birthday, birth time, or photos.
- The share card includes the Chinese zodiac animal, soft sparkle/floral decorations, a "little luck" badge, and a small "daily luck ritual" brand line as subtle content-depth and word-of-mouth cues.
- Web falls back to a text share because camera roll save/share-image behavior is native-only.
- Consumer-facing copy should avoid internal terms like `MVP`; keep developer/product notes in docs only.

Chinese almanac integration (2026-04-30):
- `goodFor` and `avoid` in the daily reading now come from real Chinese almanac (通勝 Tung Shing) data, not random seeded picks.
- Uses the `lunar-javascript` npm package (~300 KB, pure JS, no native dependencies, no API calls). Install: `npm install lunar-javascript`.
- New module: `src/lib/almanac.ts`. Calls `Lunar.Solar.fromYmd()` → `.getLunar()` → `.getDayYi()` / `.getDayJi()` to get the day's real 宜 (appropriate) and 忌 (avoid) activity lists. Maps Chinese terms to modern English phrases using embedded translation tables.
- The almanac data is date-based, not user-seed-based — everyone on the same date gets the same goodFor/avoid (this is how the real almanac works). Score, message, lucky color/number/direction/time remain personalized per user via the seed.
- `DailyReading` has two new fields: `lunarDate: string` (e.g. "三月初三") and `solarTerm?: string` (e.g. "谷雨 · Grain Rain" — only populated on one of the 24 solar term days).
- Home screen "Good for / Avoid" card now shows a "📖 From the Chinese Almanac" provenance badge + the lunar date. Solar term days show an extra accent line.
- The almanac card uses a warmer cream background (`#FBF5E8`) so the real almanac guidance feels distinct from the other reading cards.
- The "Good for today" list is intentionally capped at 3 translated items for mobile scanability.
- The 24 solar terms are bilingual: Chinese + English translation (e.g. "清明 · Clear & Bright").
- `almanac.ts` has a try/catch fallback — if the library fails for any reason, the app returns sensible default values and continues working.
- Unit tests updated: the old test checking `goodFor` items include focus names (money/love/work) was replaced with checks that verify non-empty string arrays and that two different users on the same date get identical almanac data.
- Run `npm install lunar-javascript` once before running typecheck or tests.
- `lunar-javascript` ships no TypeScript types. A minimal ambient declaration is at `src/types/lunar-javascript.d.ts` — covers the five methods the app uses (`getDayYi`, `getDayJi`, `getMonthInChinese`, `getDayInChinese`, `getJieQi`). TypeScript picks it up automatically via the default `include` in `tsconfig.json`.

Conversion, retention, content depth & visual polish (2026-05-01):
- Onboarding → paywall redirect: first-time users are routed to `/paywall` after completing onboarding. `getHasSeenPaywall` / `setHasSeenPaywall` flags in `src/lib/storage.ts`. Flag is cleared by `resetAllStoredData()` so testers can re-trigger the flow. This is the single highest-impact conversion change.
- Paywall improvements:
  - Social proof row: ★★★★★ stars + "Trusted by thousands of daily practitioners".
  - "What changes when you unlock" nudge card showing the free vs. premium delta in plain language. Updated on 2026-05-02 so it no longer claims the free daily metrics, almanac, or share card are premium-only.
  - Annual package note updated to "less than $1.25/month".
  - CTA changed to "Try free for 3 days →" (clearer trial framing).
  - Trial note: "3-day free trial · No charge until Day 4 · Cancel anytime".
  - Footer "Not now" now routes to `/home`, so users who skip the paywall after onboarding land cleanly in the app.
  - Visual polish pass on 2026-05-02: paywall route header hidden in `app/_layout.tsx`; hero now uses a champagne Premium Energy orb, softer headline ("Make every morning feel chosen"), and a three-row ritual preview before pricing.
- Streak milestones:
  - `getStreakMilestone(streak)` in `src/lib/streak.ts` — returns emoji + message for 7, 14, 30, 60, 100-day milestones, null otherwise.
  - `shouldRequestRating(streak)` returns true at 7 days — triggers `expo-store-review`.
  - Home shows a full-width mauve celebration card at each milestone with the streak count and message.
  - Streak card copy updated: below 7 days, shows "X more days to your first milestone" as a progress nudge.
- In-app rating prompt:
  - Lazy-loads `expo-store-review` (try/catch — no-op if not available).
  - Fires 2 seconds after home mounts at 7-day streak (delayed so screen is rendered first).
  - Run `npm install expo-store-review` before building for TestFlight.
- Personalized push notifications:
  - `syncLocalDailyReminder` in `notifications.ts` now accepts an optional `ReminderReading` (`{ luckyColor, luckyNumber, score }`).
  - When today's reading is available, the notification body includes the user's actual lucky color and number (e.g. "Your lucky color today is Gold. Open to see what it means for you.").
  - Home screen reschedules the notification with today's reading data after generating it each morning.
- Skeleton loading screen:
  - `HomeSkeleton` component replaces the plain `ActivityIndicator` on home.
  - `SkeletonBlock` uses `Animated.loop` shimmer (opacity 0.35↔0.65) matching the native skeleton pattern.
  - Layout matches real home: header, score card, 2×2 metric grid, zodiac card, almanac card.
- Entrance animation:
  - Home content wraps in `Animated.View` with opacity fade-in (0→1, 500ms) triggered when data finishes loading.
- Fortune quotes:
  - 30-entry `fortuneQuotes` pool added to `luck.ts` — Chinese and world wisdom proverbs, not generic affirmations.
  - `DailyReading.fortuneQuote` field added to `src/types.ts`.
  - `generateDailyReading` populates it via `pickFromArrayWithSeed(fortuneQuotes, seed, 14)` (deterministic per user-day).
  - Surfaced in `app/detail.tsx` as a styled quote card (lavender background, italic text, decorative ❝ mark) between the main message and the detail readings.
- Content expansion:
  - `mainMessages` expanded to ~150 entries (added seasons & flow, luck & readiness, Chinese almanac wisdom, wealth & abundance, action & courage categories).
  - Minimum repeat cycle now well over 90 days.
- `src/lib/notifications.ts`: new `ReminderReading` type exported for use in `home.tsx`.
- New npm packages needed (not yet installed — run before building):
  - `expo-store-review` — for in-app rating prompt at 7-day streak.

Monetization + App Store prep (2026-05-01):
- Subscription model implemented via RevenueCat (`react-native-purchases`). New module: `src/lib/purchases.ts`.
  - Lazy dynamic import (`import('react-native-purchases')`) so the app runs without the package installed — fully graceful no-op if RevenueCat is not configured.
  - Entitlement ID: `premium`. Product IDs: `com.luckyday.premium.monthly`, `com.luckyday.premium.annual`.
  - API key placeholder: `YOUR_REVENUECAT_IOS_KEY_HERE` in `src/lib/purchases.ts` — replace before building for TestFlight.
  - Functions exposed: `initPurchases()`, `getPremiumStatus()`, `getOfferings()`, `purchasePackage()`, `restorePurchases()`.
- New screen: `app/paywall.tsx`
  - Full-screen paywall with ScrollView layout.
  - Hero card (mauve background, decorative circles), 8-feature list, dynamic pricing from RevenueCat, static fallback ($14.99/yr, $2.99/mo) when RevenueCat not configured.
  - Annual package pre-selected with "BEST VALUE" badge. 3-day free trial note. "Restore purchase" and "Privacy" footer links.
  - Handles cancellation gracefully (no error alert if user cancels the native sheet).
  - Run: `npm install react-native-purchases` before TestFlight purchase QA. Typecheck can pass before install because `src/types/react-native-purchases.d.ts` declares the optional runtime surface.
- New component: `src/components/PremiumGate.tsx`
  - Wraps premium-only content sections. When free, renders children at 15% opacity underneath an absolute lock overlay with a "Start free trial →" CTA routing to `/paywall`.
  - Web: `backdropFilter: blur(6px)` overlay. Native: shadow-only overlay.
- Home monetization softened (2026-05-02):
  - Removed repeated Home lock overlays from the lucky metrics grid, Chinese Almanac card, and Small Action card. These are now visible to free users so the daily ritual feels valuable before the app asks for money.
  - Added one mauve/champagne Premium teaser card after the share action: "Go deeper when you're ready". It routes to `/paywall` without interrupting the first-scroll experience.
  - Header still shows "✨ Upgrade" mauve pill button for free users, linking to `/paywall`.
  - `isPremium` state loads in `useFocusEffect` alongside `getStoredProfile` via `getPremiumStatus()`.
  - Added `src/types/react-native-purchases.d.ts` so TypeScript can pass while RevenueCat remains optional/not installed. The runtime wrapper still no-ops until the package and API key are configured.
- Content pools expanded dramatically (2026-05-01):
  - `mainMessages`: 47 → ~95 entries (new categories: abundance, clarity, relationships, growth, joy, practical wisdom, mindset).
  - Per-focus pools (`moneyReadings`, `loveReadings`, `workReadings`, `healthReadings`): 10 → 30 each.
  - `warnings`: 20 → 35. `actions`: 30 → 70. `luckyTimes`: 6 → 11 windows.
  - Added colors: Purple, Orange, Cream. Minimum repeat interval now ~90 days.
  - New helper: `pickFocusReading()` — picks from the most relevant focus pool for the user, falls back to generic pool.
- Privacy policy: `docs/PRIVACY_POLICY.md`
  - Apple-compliant. Covers local AsyncStorage, photo handling (never uploaded), RevenueCat (anonymous ID only), local notifications, GDPR/CCPA, children's privacy (under 13).
  - Placeholders: `[YOUR NAME / COMPANY NAME]`, `[YOUR EMAIL ADDRESS]` — fill before App Store submission.
  - Must be hosted at a public URL before submitting to App Store Connect (GitHub Pages, Notion, Carrd all work).
- App Store listing: `docs/APP_STORE_LISTING.md`
  - Name: `LuckyDay` (8 chars). Subtitle: `Daily luck from the almanac` (28 chars).
  - Keywords (96 chars): `luck,almanac,chinese zodiac,fortune,daily ritual,lucky number,horoscope,feng shui,manifestation`.
  - Full description ~1,820 chars (well under 4,000 limit). Age Rating: 4+. Categories: Lifestyle / Health & Fitness.
  - Pricing: Free + IAP. Monthly $2.99, Annual $14.99 (3-day free trial).
  - 6-screenshot order guide and App Privacy Labels guidance included.
  - Pre-submission checklist included.
- App icon: `assets/icon.png` (1024×1024)
  - Mauve gradient background, two translucent white decorative circles (matches EnergyScoreCard brand motif).
  - Gold dot halo (28 dots), champagne orb with gold border, clean 4-pointed star (goldDeep/gold gradient), center dot (champagne).
  - Master file: `assets/icon.png`. Splash/adaptive colors updated to `#FEF0F5` in `app.json`.
- Pre-launch checklist (must-do before App Store submission):
  1. `npm install react-native-purchases`
  2. Create RevenueCat account at revenuecat.com, add iOS app, create entitlement `premium` and products
  3. Replace `YOUR_REVENUECAT_IOS_KEY_HERE` in `src/lib/purchases.ts`
  4. Create In-App Purchases in App Store Connect (monthly + annual)
  5. Enroll Apple Developer account at developer.apple.com ($99/year)
  6. Host privacy policy at a public URL
  7. Real-device QA: share card, camera, notifications, purchase/restore flow
  8. Capture screenshots on iPhone 15 Pro Max simulator or real device

UI upgrade pass — "Vibrant Sakura" polish (2026-05-01):
- Palette deepened for more saturation and presence: `mauve` → `#C03A78` (more vibrant magenta-rose, was `#A8467C`), `luckyGold` → `#EDBA40` (brighter, more luminous, was `#D6A84A`), `roseGold` → `#D690B0` (deeper, more visible border color, was `#E8A8C0`), `goldDeep` → `#9A6410`, `muted` → `#8A5A76`, `line` → `#E2C5D6`, `background` → `#FEF0F5`, `panelStrong` → `#FBE8F3`.
- Added `colors.lavender: '#EDE8FF'` — soft mystical purple used for the Time metric card and Small Action card. Breaks the monotonous all-warm-cream card palette and adds a spiritual/mystical dimension to the color story.
- `Card` component: `borderWidth` increased 1→1.5px; `shadowOpacity` increased 0.08→0.13; web boxShadow updated to `rgba(192,58,120,0.12)`. Cards now have visible elevation.
- `AppButton` primary: changed from gold background + ink text to **mauve background + white text**. Mauve is the brand color; white text achieves 5:1 contrast (WCAG AA). Added `letterSpacing: 0.4` to button labels. Button height increased to 56px minimum.
- `LuckyMetricCard`: Time card now uses `colors.lavender` background + `#C8BFEE` border + purple-tinted text (`#5A47B0` value, `#7B6CB8` note). Direction card border upgraded to `colors.luckyGold`. Decor symbol for time changed to `✺` (distinct from color/number cards). All non-number card values changed from `fontWeight: '900'` → `'800'` for better hierarchy.
- `SectionRow`: label color changed from `colors.goldDeep` → `colors.mauve`, added `letterSpacing: 1.4`. Value `fontWeight` set to `'500'` and `lineHeight: 25` for better readability.
- Landing hero: app name font size 52→54, letter-spacing −0.5→−1; sparkles fontSize 24→26, letter-spacing 6→10; tagline `fontWeight: '600'`; prompt text `fontSize: 22→24`, color changed from mauve to `colors.ink` for contrast.
- Home kicker: `fontSize: 14→11`, `letterSpacing: 2` (tighter small caps). Title: `fontSize: 32→34`, `letterSpacing: −0.5`.
- Home almanac badge: `fontSize: 12→11`, `letterSpacing: 0.8` added. Double-space in badge text fixed.
- Home guidance (Small Action) card: changed from `sunrise` to `lavender` background, matching the Time metric card's mystical accent.
- Landing guidance card: same lavender treatment as home.
- No new npm packages. All changes backward-compatible.

UI redesign pass — "Sakura Bloom" palette (2026-04-30):
- Core color overhaul: `colors.mauve` changed from `#6E365B` (muddy dark maroon-purple) to `#A8467C` (clear rose-pink). This single change cascades across all hero cards, chip selections, labels, and accent text. The old color read as dated/heavy; the new one reads as feminine and vibrant.
- Supporting palette softened: `background` → `#FFF5F9`, `panelStrong` → `#FFF0F7`, `muted` → `#9B6B88`, `faint` → `#D4A8C0`, `line` → `#EDD8E8`, `roseGold` → `#E8A8C0`.
- Border radii increased across the board (sm: 8→10, md: 14→16, lg: 22→24) for a rounder, cuter feel.
- Card shadows changed from dark ink shadow to rose-tinted (`colors.mauve` shadow at 8% opacity on native; `rgba(168,70,124,0.08)` on web). Cards feel softer and warmer.
- `EnergyScoreCard` hero card now has two decorative translucent white circles (absolute-positioned) that simulate a gradient/depth effect — no new packages needed, pure React Native View styling.
- Onboarding intro card gets the same decorative circle treatment. Progress bar changed from champagne/28% opacity to white/22% opacity for cleaner contrast on the rose background. Title line-height tightened.
- `AppButton` primary button: shadow slightly increased (28%→32% opacity, radius 14→18). All button variants now have 1.5px borders. Pressed state adds a subtle `scale: 0.98` transform for tactile feedback.
- Landing page hero tagline now ends with ✨. App name font size increased from 48→52.
- Home nav grid cards: border updated to `colors.roseGold`, padding increased to `spacing.lg` for a more prominent feel.
- Chip unselected text color changed from `colors.ink` to `colors.muted` so unselected state is clearly softer than selected (rose-pink filled).
- Input border width increased from 1→1.5px for a crisper look on the white card background.
- All changes are backward-compatible — no new packages installed, all existing tests continue to pass.

UI polish pass (2026-04-29):
- Home screen content reordered: 2×2 lucky metric grid now appears directly after EnergyScoreCard so the hero and its specifics are visible in one scroll without burying them below fold.
- Home streak empty state fixed: shows "Start your ritual today ✨" instead of "0 days ✨" on first visit.
- Home nav buttons replaced with a horizontal 3-column card grid (Daily detail, Reading history, Rate today) with emoji + mauve label — matches the app palette and reads as navigation, not secondary text buttons.
- Feedback screen title changed from "Was today accurate?" to "Did today feel lucky? ✨" — removes A/B-test language.
- Feedback screen now includes a subtitle: "Your rating helps shape future readings." — adds a clear value exchange.
- Feedback rating buttons now show an emoji above the label (🍀/🌙/🌧️) and use mauve selected state to match the app palette.
- Feedback tags label changed to "What was in the energy today?" and selected tags now use mauve background with white text.
- Chinese zodiac tone copy varied across all 12 animals — endings are now qualities/energies/descriptors, no longer all end in "luck".
- Birthday input replaced with `BirthdayPicker` component in both onboarding and settings: a scroll-and-tap year/month/day picker. No new npm packages required.
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

Last verified on 2026-05-02 after Home monetization softening:
- `npm run typecheck` passed
- `npm test` passed: 14 tests
- `npm run e2e` passed: 3 browser smoke tests, including the onboarding → paywall → Not now → Home path
- In-app browser QA passed for Home showing the core ritual visible to free users, no repeated PremiumGate overlays, share prompt, and single "Go deeper when you're ready" Premium teaser.
- In-app browser QA passed for Paywall showing the hidden route header, Premium Energy orb hero, ritual preview rows, pricing cards, CTA, and footer links.
- In-app browser QA passed for Onboarding Step 1 showing the scroll birthday picker.
- Browser console no longer shows project-owned web shadow or `pointerEvents` deprecation warnings after reload. The remaining warning is the expected `expo-notifications` unsupported-on-web listener warning.

Post UI polish pass note:
- The onboarding e2e tests were updated for the scroll birthday picker.
- Real-device QA of BirthdayPicker and TimePickerInput should be prioritized — scroll picker and segmented time behavior on small screens need physical device confirmation.

E2E note:
- `npm run e2e` includes 3 browser smoke tests, including onboarding without photos and the scroll birthday picker.
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
   - Add more luck/message variety without AI.

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
- `src/components/BirthdayPicker.tsx`: scroll-and-tap birthday picker
- `src/components/TimePickerInput.tsx`: segmented HH/MM time input
- `app/onboarding.tsx`: first-time flow
- `app/settings.tsx`: profile editing and photo retake
- `app/feedback.tsx`: daily rating screen
- `supabase/schema.sql`: future database structure
- `src/lib/luck.test.ts`: unit test coverage
- `e2e/luckyday.spec.ts`: browser smoke tests

## Commit Protocol

This repo follows the Lore commit protocol described in the workspace instructions. Commit messages should explain why, include relevant constraints/rejected alternatives, and list tested/not-tested evidence.
