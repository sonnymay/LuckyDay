# LuckyDay — Codex Handoff Document

**Last updated:** 2026-05-14
**Stack:** Expo SDK 54, React Native, expo-router ~6.0.23, TypeScript, RevenueCat IAP, PostHog analytics
**Target:** iOS App Store (primary). Android and Web secondary.

> **2026-05-14 — Build 14 in review (pending verdict).** Build 13 was rejected (Guideline 4.3(b) — saturated category / fortune-telling clone signal). Response: full **English-only UI sweep** (commit `f13d08c`) stripping all displayed Chinese characters, plus repositioning copy that removed user-facing "luck"/"fortune" framing in favor of Chinese Almanac language (commit `8736ad9`). Shipped Build 14 with this repositioning + several premium-feel features: auspicious-day (黄道吉日) badge, streak-save warning push, solar term countdown, midnight rollover, Chinese double-hour chip, Reduce Motion + VoiceOver accessibility, live best-time progress bar, streak milestone celebrations, time-aware greeting. Reading-soul audit Wk1 (`src/lib/luck.ts`) and Wk2 (`src/lib/almanac.ts`) complete — 6 strings refined to almanac voice. 9-routine automation system live (morning health, polish-lens, review-watch, accessibility, small-screen, competitor-mining, reading-soul, apply-insight, delight-audit) plus weekly sync-main + daily commit-log scripts. Tests grew 43 → 94 (3 → 9 test files including auspiciousDay). All work on `codex-luckyday-product-polish`; clean tree, pushed.
>
> **Older context (kept for continuity) ↓**
>
> **2026-05-08 02:30 — Build 10 REJECTED.** Apple rejected on iPad Air 11-inch / iPadOS 26.4.2 with the same Guideline 2.1(a) crash-on-launch. Crash signature: JS-thrown unhandled exception → `RCTExceptionsManager` → `objc_exception_rethrow` → `abort()`. **Not** a native module init crash anymore — Build 10's lazy-load mitigation worked at the native layer; the new failure is a JS-level exception escalating to fatal.
>
> **2026-05-09 — Build 13 submitted, iPhone-only.** Build 12 was rejected (4th time) for crash on iPad Air 11-inch M3 / iPadOS 26.4.2. Crash logs confirm a NATIVE Objective-C exception thrown ~205ms into launch — the JS-level ErrorBoundary cannot catch it. Without iPad Air M3 device access for repro, real fix is impossible. Build 13 strategy: declared `supportsTablet: false` (Apple now reviews on iPhone, where app has never crashed) + removed `@sentry/react-native` and `posthog-react-native` packages (their iOS pods auto-installed crash-handler swizzling that increased risk surface for zero benefit since both were env-gated no-ops). Wrappers in `src/lib/{sentry,analytics}.ts` kept as inert stubs so all call sites still compile. Build 13 (commit `3404911`) is now "Ready for Review" in App Store Connect.
>
> **App Store Connect prep done (2026-05-10):** App Review notes paste (1734 chars) saved into version page Notes field with full reviewer test plan, Permissions, Subscription map, Contact info. Premium Monthly + Premium Annual subscriptions: Review Notes saved (519/522 chars) with sandbox test instructions. App Privacy: "Data Not Collected" published. **Subscription Review Screenshot upload remains the only manual user task** — Chrome MCP cannot upload files to App Store Connect (DevTools Protocol returns "Not allowed", and the imageId-from-screenshot path in the upload_image tool requires user-uploaded images, not tool-captured ones). User must manually upload `~/Downloads/luckyday-paywall.png` (840×1800, exceeds Apple's 640×920 minimum) to both subscriptions' "Choose File" in the Review Information section.

---

## 1. Current App Status

**Build `1.0.0 (10)` REJECTED (2026-05-08, 12:07 AM).** Same Guideline 2.1(a) crash-on-launch, this time on **iPad Air 11-inch (M3) / iPadOS 26.4.2**. Three identical crash logs all show JS-thrown unhandled exception escalating to native abort.

**Build `1.0.0 (13)` submitted to App Store Connect (2026-05-09, 10:48 PM)** with iPhone-only declaration (`supportsTablet: false`) and dormant native crash-handler pods removed (`@sentry/react-native`, `posthog-react-native`). Sentry/analytics call sites preserved via inert stubs — re-add native packages in v1.1 with proper DSN/key + iPad device test access. Build 13 is "Ready for Review" in ASC; user manually swapped Build 12→13 in the rejected submission. App Review notes + subscription review notes + privacy verified by automated browser drive on 2026-05-10.

App Store Connect metadata (screenshots, listing copy, privacy URL) was sufficient for all prior reviews — rejection was crash-only, not metadata. Screenshots and listing are not blockers.

Submission checklist:

- [x] App Store crash mitigation 1 — `newArchEnabled` set to `false` in `app.json`
- [x] App Store crash mitigation 2 — `_layout.tsx` catches native splash-screen promise failures
- [x] Build 9 UX polish — birthday picker desync, coin label wrap, consent toggle, paywall copy (see Section 4b)
- [x] Build 10 crash mitigation — remove root splash/font/purchases startup calls and lazy-load camera/notification modules (see Section 4c)
- [x] App Store screenshots uploaded (sufficient for Apple review)
- [x] App Store Connect listing metadata complete
- [x] RevenueCat dashboard fully configured — key, bundle ID, products, entitlement, offering (see Section 4e)
- [x] Analytics scaffold — PostHog SDK wired with env-gated lazy init, purchase funnel events live (see Section 4f)
- [x] Test coverage expanded — 17 → 43 tests (almanac, streak, luck), all green (see Section 4f)
- [x] RevenueCat API key now reads `EXPO_PUBLIC_REVENUECAT_IOS_KEY` env var with prod fallback
- [ ] **StoreKit sandbox pass on real device** — paywall untested on hardware; verify before app goes live
- [ ] **Update annual price in App Store Connect** — change `com.luckyday.premium.annual` from $29.99 → $19.99 (UI disabled while Build 10 is in review; unlocks on approval)
- [ ] **Submit subscription metadata for review** — both subscriptions still in "Missing Metadata / Prepare for Submission" state in App Store Connect (see Section 5)
- [ ] **Set `EXPO_PUBLIC_POSTHOG_API_KEY`** — sign up at us.posthog.com and add to `.env` to activate analytics (no-op until set)

---

## 2. Architecture Overview

```
app/
  _layout.tsx        Root Stack navigator. Screens: index, onboarding, home, detail,
                     history, settings, feedback, paywall, privacy, terms.
                     detail / history / settings all have headerShown: false
                     (TabBar handles nav).

  index.tsx          Entry: checks AsyncStorage for profile → /detail or onboarding.

  onboarding.tsx     4-step profile setup with welcome/value screen first.
                     On complete → router.replace('/detail').

  home.tsx           LOADING SCREEN ONLY. Shows star-particle animation while
                     generating the first reading, then router.replace('/detail').
                     Do NOT put content here. It is intentionally a redirect loader.

  detail.tsx         PRIMARY SCREEN. Full daily reading. Uses <Screen showTabBar>.

  history.tsx        Calendar/list of past readings. Uses <Screen showTabBar>.

  settings.tsx       Profile editing + photo management. Uses <Screen showTabBar>.

  feedback.tsx       Post-day rating: Yes / Somewhat / No + tag chips.

  paywall.tsx        RevenueCat paywall. Triggered by PremiumGate component.

  privacy.tsx        Privacy policy screen.

  terms.tsx          In-app Terms screen + Apple standard subscription terms link.

src/lib/
  luck.ts            Core reading engine. generateDailyReading(), score formula,
                     all content pools (mainMessages, moneyReadings, loveReadings,
                     workReadings, healthReadings, warnings, actions),
                     element-aware pools (moneyByElement, workByElement),
                     getMoonPhase(), getDailySeed(), pickFromArrayWithSeed().

  chineseZodiac.ts   12 animal profiles. Each has 20 dailyInsights, element,
                     luckyNumbers, emoji, tone. Also: elementLuckyColors,
                     elementSeedOffset, ZodiacElement type.

  westernZodiac.ts   12 sign insight pools, 20 entries per sign.

  almanac.ts         Real Chinese almanac data keyed by date.
                     Provides goodFor[], avoid[], lunarDate, solarTerm.

  storage.ts         AsyncStorage CRUD: profile, reading history, feedback, streak.

  purchases.ts       RevenueCat wrapper: initPurchases(), checkPremium(),
                     purchasePackage(), getOfferings(). Production-looking
                     iOS public key is present; verify dashboard config before release.

  notifications.ts   expo-notifications daily reminder management.

  streak.ts          Streak calculation from reading history.

  luckyColor.ts      getLuckyColorHex(), getLuckyColorMeaning() for UI display.

  date.ts            todayKey(), isValidDateKey().

src/components/
  AppButton.tsx      Primary / secondary / danger variants.
  Card.tsx           Standard rounded card container.
  EnergyScoreCard.tsx  Animated score orb with mood label. Takes score + message.
  Screen.tsx         ScrollView + SafeAreaView wrapper.
                     Prop: showTabBar (boolean) — controls bottom padding.
  TabBar.tsx         Custom bottom tab bar. Tabs: /detail (Today), /history, /settings.
  SectionRow.tsx     Label + value row used in reading breakdown card.
  PremiumGate.tsx    Wraps premium content; redirects to /paywall if not subscribed.
  BirthdayPicker.tsx, TimePickerInput.tsx, ProfilePhotoCapture.tsx,
  MediaConsentCard.tsx

src/styles/
  theme.ts           colors, spacing, radii, fonts (Nunito via @expo-google-fonts/nunito).

src/types.ts         Profile, DailyReading, Feedback, ProfileInput, MainFocus types.
```

---

## 3. Score Formula — CRITICAL: Never Expose Arithmetic to Users

```
baseScore    = 55 + (abs(seed + elementOffset * 3571) % 21)   → range 55–75
moonBonus    = moonPhaseBonus[moonPhase]                        → range 0–8
almanacBonus = min(almanac.goodFor.length, 5)                   → range 0–5
score        = min(96, max(50, baseScore + moonBonus + almanacBonus))
```

**DESIGN RULE:** Never show the user raw numbers from this formula (e.g., "60 + 2 + 3 = 65"). An earlier implementation did this and immediately made the score feel fake and mechanical. The score must be presented through qualitative language only:

- **Score bands** (5-band bar): Rest (≤55) → Steady (56–64) → Good (65–74) → Strong (75–84) → Peak (85+)
- **Influence chips** (3 chips below the bar): zodiac animal + strength label ("Rising today"), moon phase + lift label ("Gentle lift"), almanac + auspiciousness label ("Favorable")
- **Context sentence**: e.g. `"74 is bright and favorable — good day for forward motion."`
- **Yesterday delta**: e.g. `"↑ Up 8 from yesterday — energy is building."`

The three fields `scoreBase`, `scoreMoonBonus`, `scoreAlmanacBonus` on `DailyReading` exist only to drive the qualitative chip labels. They must never appear as raw numbers anywhere in the UI.

Scores cap at 96 and floor at 50. Do not change these bounds.

---

## 4. Files Changed This Session (2026-05-05)

### `app/detail.tsx`
- Added `nickname` state; loaded from `profile.nickname` inside `useFocusEffect`
- Page title changed from `"Today's Reading ✨"` → `"${nickname}'s luck today ✨"` (falls back to generic if no nickname)
- **Score section order (top to bottom):**
  1. `EnergyScoreCard` — animated orb, score number, mood label, main message
  2. Action hero card — dark mauve, "🍀 Do this today" + one clear sentence
  3. Best Time card — prominent near the top as the daily quick-use hook
  4. Good for / Avoid almanac pills with qualitative trust subtitle
  5. Score context card — 5-band scale bar + band-language sentence + yesterday delta
  6. Three qualitative influence chips — zodiac/moon/almanac, no raw numbers
  7. Date/lunar date/solar term card + main message (alternate display)
  8. Lucky color + lucky number quick cards
  9. Direction quick card
  10. Progressive deep-dive card: shows top 3 insights by default, then "Show more" for the rest
  11. Share button
- Fortune quote card: **removed entirely** (was generic, added no value)
- `scoreReason`: exists in data but is **intentionally not displayed**
- Action was **promoted** from bottom of breakdown to hero card near top
- Removed the static daily influence explanation from the main screen. Repeated identity-style language like "Metal adds clarity" belongs in profile/context surfaces, not the daily dashboard.
- Score context copy now uses band language ("Strong energy today", "Peak flow today") instead of number-first wording, so scores do not read like school grades.
- Date display now uses a reader-friendly calendar line, e.g. `"May 5, 2026 · 三月十九 · 立夏"`, instead of showing raw ISO-style dates.
- Removed duplicate display of `reading.mainMessage` from the lower date card. The main message now appears only in the score card, preventing the repeated visible sentence bug.

### `src/lib/luck.ts`
- Added `ZodiacElement` to imports from `./chineseZodiac`
- **Narrowed base score range**: `55 + (... % 21)` (was `50 + (... % 31)`). Max daily swing is now ~20 pts, not 30 pts. Prevents jarring jumps that feel arbitrary.
- Added `moneyByElement: Partial<Record<ZodiacElement, string[]>>` — 7 entries per element:
  - Fire: act fast, follow momentum, trust first instinct
  - Water: trust intuition, read the pattern, let it flow
  - Earth: slow/steady, check the foundation, boring = correct
  - Wood: invest in growth, patient compounding, develop not flip
  - Metal: precision, audit details, quality over quantity
- Added `workByElement: Partial<Record<ZodiacElement, string[]>>` — same structure, work-specific
- **Day-of-week seed variation**: money/love/work/health picks now use `offset + day * 97` (prime multiplier). Same user gets different reads M–Su. Previously only `mainMessage` varied by day of week.
- Money and work reads use element pools: `moneyByElement[zodiacElement] ?? moneyReadings`. All 5 elements are covered; the general pool fallback should never fire in practice.
- Added `loveByElement: Partial<Record<ZodiacElement, string[]>>` — 7 entries per element:
  - Fire: warmth, spark, direct affection
  - Water: intuition, emotional current, gentle listening
  - Earth: reliability, practical care, steady trust
  - Wood: relationship growth, encouragement, patience
  - Metal: clear words, boundaries, discernment
- Added `healthByElement: Partial<Record<ZodiacElement, string[]>>` — 7 entries per element:
  - Fire: movement, cooling down, balanced intensity
  - Water: hydration, quiet, nervous system softness
  - Earth: routines, basics, steady body care
  - Wood: stretching, fresh air, gradual growth
  - Metal: structure, breath, environmental clarity
- Love and health reads now use element pools: `loveByElement[zodiacElement] ?? loveReadings` and `healthByElement[zodiacElement] ?? healthReadings`
- Added contextual warning pools:
  - `warningByElement` for Five Element-specific caution
  - `warningByMoonPhase` for phase-specific caution
  - `warningByAlmanacAvoid` for almanac avoid-context caution
- Warning selection now builds a context pool from element + moon phase + almanac avoid items and compares against the previous day's deterministic warning. If the same warning would appear two days in a row for the same profile, it steps to another warning when possible.
- Added `actionsBySolarTerm` for all 24 solar terms. On solar-term days, the "Do this today" action comes from the solar-term pool so days like `立夏 · Start of Summer` feel seasonally connected.
- Added `actionsByAlmanacGoodFor` for concrete almanac-aware actions on ordinary days.
- Added `scoreBase`, `scoreMoonBonus`, `scoreAlmanacBonus` to `generateDailyReading` return value

### `src/lib/chineseZodiac.ts`
- Expanded every animal's `dailyInsights` from **10 → 20 entries**
- New entries are character-specific. Horse pool: removed the "open road is your natural habitat" cliché (called out by test reviewer); replaced with momentum/movement/fire-energy-specific language
- Repeat cycle improved from 10 days → 20 days

### `src/lib/westernZodiac.ts`
- Expanded every sign's insight pool from **10 → 20 entries**
- New entries maintain sign-specific voice (Scorpio: depth/intensity/perception; Aries: first-mover/momentum; Libra: diplomacy/balance)
- Repeat cycle improved from 10 days → 20 days

### `src/types.ts` (changed in earlier session)
- Added to `DailyReading`: `scoreBase: number`, `scoreMoonBonus: number`, `scoreAlmanacBonus: number`, `scoreReason: string`
- Added to `DailyReading`: `zodiacElement: string` for qualitative influence-chip explanation copy
- Expanded `Feedback` into a daily reflection record:
  - `predictionMatch?: 'better' | 'aboutRight' | 'worse'`
  - `overallDay?: number` (1–5)
  - `bestTimeAccurate?: boolean`
  - `warningRelevant?: boolean`
  - `actionHelpful?: boolean`
  - `note?: string`

### `app/home.tsx` (changed in earlier session)
- Now a pure loading screen → `router.replace('/detail')` after animation
- Do NOT add content here
- Removed visible `scoreReason` rendering from the home UI. `scoreReason` remains in data but is hidden from users.
- Tightened star particle position typing to percentage template strings so `Animated.Text` style typechecks.
- App Store readiness polish: the save/share CTA now uses an `Ionicons` share icon button with a clear saving/disabled state.

### `app/onboarding.tsx` (changed in earlier session)
- Post-save now routes to `router.replace('/detail')` (was `/home`)
- App Store readiness polish: onboarding is now 4 steps with a welcome/value screen before collecting birthday, optional birth time/place, or optional photos.
- Privacy Policy and Terms links are visible in the intro card before profile collection begins.
- Birthday helper copy now explains that the date anchors zodiac and lunar calendar context while staying on-device.
- Build 9 blocker fix: Step 2 navigation has extra spacing and bottom padding so Back and Continue remain separated and visible on small iPhones.
- Privacy Policy and Terms links now show only on Step 1 instead of repeating on every onboarding header.
- Step content is clipped horizontally to reduce picker-induced horizontal overflow risk.
- Added step 3 photo trust copy before `ProfilePhotoCapture`: face = "energy field and presence," palm = "life line patterns," handwriting = "intention energy"
- Privacy Policy link is visible in the onboarding intro card before the app collects birthday, optional birth details, or optional photos. It routes to the in-app `/privacy` screen, which links to the hosted policy at `https://luckyday-privacy.tiiny.site`.

### `app/settings.tsx`
- Privacy controls now include a visible "Read Privacy Policy" link to `/privacy`.
- Profile, photo, feedback, and local data controls all remain on-device management actions.
- App Store readiness polish:
  - Replaced `LUCKYDAY ID` with `Your profile · saved locally`.
  - Added a Terms link beside Privacy Policy.
  - Moved the normal Save settings action above optional photos and local data controls.
  - Grouped reset/delete actions under a visually separate local data controls card.
  - Replaced the chain-link emoji share action with an `Ionicons` share icon.
  - Softened optional photo copy: photos are optional, LuckyDay works without them, and they can be removed anytime.
  - Build 9 polish: `Clear feedback` is now `Clear reflections` with explanatory copy; `Delete photos only` has explanatory copy; `Delete all local data` is visually more severe than `Reset profile`.
  - `Morning reminder optional` label changed to `Morning reminder` with optionality in helper text.

### `app/paywall.tsx`
- Paywall pricing state now stays calm:
  - Initial state shows `Loading App Store pricing...` with a spinner.
  - Success state shows real RevenueCat/App Store localized prices.
  - CTA reads `Unlock Premium — {price}{period}` only when a real package is loaded.
  - Failure state shows one calm error message and one retry path only.
  - Removed `App Store pricing unavailable` from the hero badge state.
  - Purchase remains blocked unless a real package is loaded.
- Footer now includes Restore Purchases, Privacy, Terms, and Not now.
- No free-trial copy is shown unless a real App Store/RevenueCat introductory offer is added later.

### `app/terms.tsx`
- Added an in-app Terms of Service screen.
- Includes simple app-use terms and a link to Apple's standard subscription terms.

### `src/components/BirthdayPicker.tsx`
- Added Year / Month / Day labels above the three picker columns.
- Selected Year, Month, and Day now have stronger visual treatment.
- Added a selected-date summary and helper copy explaining why the date matters.
- Build 9 blocker fix: first-time onboarding now defaults to a complete `Jan 1, 1990` selection and sends `1990-01-01` to the parent form on load.
- The instructional helper is hidden once a complete date is selected, so it no longer conflicts with the `Selected:` confirmation.
- Picker wrapper/columns are width-constrained to avoid Step 2 horizontal overflow.

### `src/components/EnergyScoreCard.tsx`
- Score unit now reads `/100 luck energy`.
- Added a small helper line: `Luck energy is your simple daily momentum signal.`

### `app/detail.tsx`
- Added subtle LuckyDay branding at the top of the primary Today dashboard.
- Replaced emoji share CTA with an `Ionicons` share button.
- Kept score/order/progressive-disclosure flow intact.

### `app/history.tsx`
- Prediction vs Reality summary no longer shows rows of `—` when there are no reflections.
- Empty states now say: `Reflect on a reading to start tracking your patterns.`
- Calendar already includes day-of-week headers and remains unchanged.

### `app/_layout.tsx`
- Registered the new `terms` route.
- Build 10 launch hardening supersedes the earlier splash-screen catch approach: root startup no longer imports or calls `expo-splash-screen`, `expo-font`, or RevenueCat.
- Post-build-10 improvement: `detail.tsx` now saves today's generated reading into local reading history from the actual primary Today screen. This keeps History and streaks accurate now that `home.tsx` is not the content screen.
- Added a compact ritual streak pill below the energy score. It uses existing streak helpers, stays qualitative/simple, and does not expose score arithmetic.

### `app/feedback.tsx`
- Reworked from simple Yes/Somewhat/No feedback into a calm daily reflection journal.
- Main action is now 1–2 taps:
  - Shows the prediction automatically, e.g. `"We predicted: 78 · Strong"`
  - Asks `"How did your day feel?"`
  - Primary buttons: `"Better than predicted"`, `"About right"`, `"Worse than predicted"`
- Detailed fields remain optional and lower priority:
  - Overall day rating from 1–5
  - Whether the best time felt accurate
  - Whether the warning felt relevant
  - Whether "Do This Today" helped
  - Optional tags and a short note
- Save payoff now says either:
  - `"Logged. After 3 days, LuckyDay can start showing your personal accuracy pattern."`
  - Or, after enough reflected days: `"Your readings matched your reality X of the last Y days."`
- Supports editing a specific date via `?date=YYYY-MM-DD`, used by History cards.

### `app/history.tsx`
- History now loads stored feedback alongside reading history.
- Day 1 / no-data state now says:
  - `"Your luck history starts tonight."`
  - `"Check in after your day to compare prediction vs reality."`
- Empty-state CTA routes to today's reading instead of leaving History blank.
- Added a clearer "Prediction vs. reality" summary for recent reflected days:
  - `"Last 7 days: readings matched your reality X/Y reflected days"`
  - Qualitative reason tag when possible, e.g. `"Match: Almanac favorable"` or `"Mismatch: Strong score, but day felt harder"`
  - Reading felt about right
  - Strong/Peak matched good days
  - Best time felt accurate
  - Warning felt useful
  - Do This Today helped
- Each history card now has a small reflection action and shows saved journal context when available.
- Summary stays qualitative and compact; no score formula or raw score arithmetic is exposed.

### `app/index.tsx`
- First-time users without a stored profile now route directly to `/onboarding`.
- Existing users with a stored profile now route directly to `/detail`.
- This keeps the first real reading feeling earned through profile setup instead of showing a sample reading first.

### `app/_layout.tsx` (changed in earlier session)
- `detail` screen: `headerShown: false`

### `src/components/TabBar.tsx` (changed in earlier session)
- Today tab path changed from `/home` → `/detail`
- Navigation icons use `@expo/vector-icons/Ionicons` for Today, History, and Profile. Web runtime visually renders the icons; Chrome accessibility exposes icon-font private glyph codes, which is expected for icon fonts and not a visible broken-box issue.

### `src/components/PremiumGate.tsx`
- Removed remaining visible free-trial copy from the locked premium overlay.
- CTA now says `"Open Premium →"` and supporting copy says `"See App Store pricing before you purchase."`
- Purchase/trial details remain confined to the paywall where RevenueCat/App Store packages can be shown.

### `src/lib/notifications.ts` (changed in earlier session)
- All notification titles and bodies rewritten with curiosity-driven copy
- 10 title variants, 15 body variants
- Push notification support already exists for the user-configured daily reminder. Evening PvR reminders around 8 PM are **not** added yet because they need a separate stored notification id, settings/permission behavior, and opt-in copy to avoid surprising users.

### `app/paywall.tsx` (changed in earlier session)
- `FEATURES` array updated to concrete daily-use benefits (not abstract premium language)
- Restore Purchases is visible in the footer and routes through RevenueCat restore.
- Paywall pricing now only displays App Store / RevenueCat package prices when packages load successfully.
- Removed hardcoded fallback subscription prices and unverified free-trial promises.
- Annual package copy now says "best yearly value" instead of an incorrect monthly equivalent.

### `src/lib/purchases.ts`
- RevenueCat iOS public key is configured in code and no longer labeled as a placeholder.
- Remaining release check: verify the key, current offering, annual/monthly packages, and `premium` entitlement are all production-ready in RevenueCat before EAS production build.

### `package.json` / `package-lock.json`
- Added `@expo/vector-icons` as an explicit Expo dependency so imports in `app/home.tsx`, `app/paywall.tsx`, and `src/components/TabBar.tsx` resolve cleanly in TypeScript.

### `app.json` (changed 2026-05-05)
- `"newArchEnabled"` changed from `true` → `false`
- **Updated crash diagnosis from Apple logs dated 2026-05-06:** build `1.0.0 (7)` had `newArchEnabled: false`, but still crashed at launch on `com.facebook.react.ExceptionsManagerQueue` with `EXC_CRASH / SIGABRT`. This means the old-architecture bridge converted the native startup failure into a React fatal exception instead of a TurboModule abort.
- **Most likely culprit:** `SplashScreen.preventAutoHideAsync()` was called at module-load time in `_layout.tsx` without a `.catch()`. If the iPadOS 26 splash native module rejects/throws during startup, the unhandled failure is fatal in release. Current source now catches both `preventAutoHideAsync()` and `hideAsync()` failures.
- **Why not RevenueCat:** build 7's `package.json` did not include `react-native-purchases`, and the crash occurs before paywall interaction.
- **Long-term path:** Once Expo SDK 55+ (or whichever version adds full iOS 26 support) ships and is stable, re-enable New Architecture and verify on iPadOS 26.

### Verification (2026-05-05)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes: 2 test files, 18 tests
- Added tests for consecutive-day warning freshness and solar-term action context.
- `git diff --check` passes
- Launch-blocker sweep completed:
  - Privacy Policy link is visible in onboarding and Settings/Profile.
  - Privacy Policy URL `https://luckyday-privacy.tiiny.site` returns HTTP 200 and is not a placeholder.
  - Paywall has visible Restore Purchases.
  - Paywall does not show fallback/test-only prices when RevenueCat packages fail to load.
  - RevenueCat key is configured in code; dashboard/package/entitlement verification remains before production build.
  - App Store subscription/IAP product verification remains a true release checklist item until verified in RevenueCat and App Store Connect.
  - Main reading quick-use area now prioritizes score, one-sentence action, Best Time, Good For, and Avoid.
  - History has a friendly Day 1 empty state.
  - Duplicate visible reading text check fixed the repeated `"Let yourself enjoy today without making it mean anything more."` display.
  - Date display check fixed raw `YYYY-MM-DD` display on the main reading screen.
  - Navigation icon check: Today, History, and Profile icons render visually in the running local web app; direct iOS simulator launch was unavailable in this environment because Apple's `simctl` tool is not installed.
  - "Show more" on the reading screen is a local state expansion with no navigation or reload.

### Paywall cleanup for next build (after build 1.0.0 (7) submission)
- Added missing `react-native-purchases` dependency so RevenueCat packages can load in native builds.
- Updated `app/paywall.tsx` to avoid a dead-end "Premium unavailable" state: users now get a retryable App Store pricing state and can still restore purchases.
- Moved visible package pricing into the hero when App Store packages load.
- Replaced the duplicate daily score hero with a locked Premium reading preview.
- Consolidated repeated feature content into one feature list and a clearer Free vs Premium comparison.
- Did not add fake free-trial copy or fake social proof; trial/offer messaging should be added only after App Store Connect and RevenueCat have a real introductory offer configured.
- Verification: `/usr/local/bin/npm run typecheck` passes; tests pass with `/private/tmp/luckyday-node20 node_modules/vitest/vitest.mjs run src/lib/*.test.ts` after ad-hoc signing a temporary Node 20 binary, because macOS rejects the local Vitest/Rolldown native binding under the normal signed Node binary. `git diff --check` passes.

### 4b. Build 9 UX Polish + Launch Crash Follow-up (2026-05-06)

Fixes applied after live review of the Build 8/9 candidate and after Apple's May 6 crash logs for rejected build `1.0.0 (7)`.

#### `src/components/BirthdayPicker.tsx` — picker desync + default position
- **Root cause of visual/state desync:** `WheelColumn` had no scroll ref. Tapping an item updated state but left the scroll position unchanged, so the highlight and the "Selected:" bar could disagree.
- **Fix:** Added `scrollRef` to each `WheelColumn`. On item press, `scrollTo` is called to center that item visually before `onSelect` fires. `onMomentumScrollEnd` reads the final scroll offset and derives the selected index, keeping scroll position and state permanently in sync.
- **Snap interval corrected:** `snapToInterval` was `itemHeight` (42px) but actual item step including gap is `itemHeight + spacing.xs` (48px). Changed to `ITEM_STEP = 48` so snapping aligns with item positions.
- **Default position:** `DEFAULT_BIRTHDAY = '1990-01-01'`. On first render with no `value` prop, the picker defaults to Jan 1 1990 and immediately calls `onChange('1990-01-01')`, so the parent form is never silently blocked by an invisible missing-date state. The user can still scroll to any date before tapping Continue.
- **Help text:** Hidden once a complete date is selected (replaces "Selected:" summary). Picker no longer shows both simultaneously.
- **Scroll-on-mount:** `useEffect` fires on `selectedValue`/`items` change and scrolls to the correct index via `setTimeout(() => scrollTo, 0)` to guarantee layout has completed.

#### `app/onboarding.tsx` — duplicate helper text + step header off-screen
- **Duplicate copy removed:** Deleted the `<Text style={styles.helpText}>This anchors your zodiac and lunar calendar context. It stays on this device.</Text>` line that appeared below `<BirthdayPicker>`. The BirthdayPicker component already shows its own help text; the duplicate was a copy-paste artifact from the Codex pass.
- **Step header visibility:** Added `key={step}` to `<Screen>` so the ScrollView remounts on each step transition and always starts at scroll position 0. Without this, the BirthdayPicker's nested ScrollViews caused the parent to auto-scroll past the "STEP 2 OF 4" header on load.

#### `src/components/EnergyScoreCard.tsx` — "/100 LUCK ENERGY" wrapping
- Changed `scoreUnit` text from `/100 luck energy` to `/100`. The word "luck energy" was uppercase + letter-spaced inside a 132px circle at 13px, causing a two-line wrap in the bottom-left quadrant that read as a layout glitch.
- `fontSize` bumped to 15, `letterSpacing` reduced to 0.5, `opacity: 0.7` so it reads as a secondary label next to the large score number.
- The existing `energyHelp` line below the orb ("Luck energy is your simple daily momentum signal.") retains the full phrase in context where it has room to breathe.
- **Note:** The HANDOFF Section 4 entry for `EnergyScoreCard.tsx` from the earlier Codex pass says "Score unit now reads `/100 luck energy`" — this is now superseded. The coin shows `/100` only.

#### `src/components/MediaConsentCard.tsx` — toggle not adjacent to consent sentence
- **Problem:** The checkbox was in the card `header` row (top of the card), visually separated from the consent sentence "I agree to save optional photos on this device." by the privacy copy block and three trust pills. Reviewers could miss the toggle entirely.
- **Fix:** Removed the checkbox from the header row. The `consentRow` is now a horizontal flex row containing the checkbox immediately left of the consent sentence — toggle and text are always adjacent with no visual separation.
- `consentRow` style updated: `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.sm`. `consentText` gets `flex: 1` so it wraps cleanly next to the fixed-size checkbox.

#### `app/paywall.tsx` — subscription renewal notice shown during failed pricing state
- **Problem:** `trialNote` ("Subscription renews automatically · Cancel anytime in your Apple ID settings") was always rendered below the CTA button. When pricing fails and the CTA reads "Retry pricing", this renewal notice is nonsensical — there is nothing to subscribe to yet.
- **Fix:** `trialNote` is now wrapped in `{canPurchase ? ... : null}`. It only renders when a real App Store package is loaded and selected. The legal disclosure (`legal` block at the bottom of the screen) remains unconditional since it covers the full app store context.

#### `app/settings.tsx` — two quick polish wins
- **Profile subtitle capitalisation (#13):** "Your profile · saved locally" → "Saved locally on this device". The lowercase "saved" after the centre-dot looked like a sentence fragment.
- **Destructive action context (#14):** local data actions now use the `DataAction` component with `description` and `tone` props:
  - Clear reflections → "Clears your reflection notes and ratings."
  - Delete photos only → "Removes your face, palm, and handwriting photos. Profile stays intact."
  - Reset profile → "Removes your nickname, birthday, and focuses. Photos are kept."
  - Delete all local data → "Removes everything including photos. Cannot be undone."
- `Delete all local data` uses the strongest visual tone so it reads as more severe than reset.
- "Morning reminder optional" labels were changed to "Morning reminder" with optionality moved to helper text.

#### Crash diagnosis correction (recorded for Codex continuity)
The prior HANDOFF entry attributed the launch crash to `react-native-purchases` / `RC.configure()`. That was wrong — `react-native-purchases` was never in `package.json`. The actual crash path:
- Build 6 (New Arch on): `ObjCTurboModule::performVoidMethodInvocation` → `_objc_terminate()` → `abort()`. Fixed by `newArchEnabled: false`.
- Build 7 (Old Arch): `com.facebook.react.ExceptionsManagerQueue` crash. Old arch converted the same native startup failure into a React JS fatal. Fixed by catching `SplashScreen.preventAutoHideAsync()` and `hideAsync()` rejections in `_layout.tsx`.
- Both crashes occurred within ~72ms of launch, before JS had time to call any user-interaction code.

#### Verification status
- `/usr/local/bin/npm run typecheck` passes.
- `PATH=/private/tmp:$PATH /usr/local/bin/npm test` passes: 2 files, 18 tests.
- `git diff --check` passes.

#### Next commit/build command

```bash
cd /Users/santipapmay/Downloads/LuckyDay
git add -A
git commit -m "Build 9: launch crash hardening and UX polish"
eas build --platform ios --profile production
```

Do not resubmit rejected build `1.0.0 (7)`. Submit a fresh build from the current source after committing.

---

### 4c. Build 10 Launch Crash Mitigation (2026-05-06)

Fixes applied after Apple rejected build `1.0.0 (9)` for a launch crash on iPhone 17 Pro Max running iOS 26.4.2.

#### Crash log summary
- All three build 9 crash logs show `EXC_CRASH / SIGABRT`.
- Faulting queue: `com.facebook.react.ExceptionsManagerQueue`.
- Crashes occur almost immediately after process launch: roughly 90ms, 94ms, and 170ms.
- The repeated stack shape is `objc_exception_throw` → app native frame offsets → `NSInvocation invoke` → React exception queue → `abort()`.
- This means the previous splash `.catch()` hardening was not enough. The failure is still a native module call during early startup, before the first user interaction.

#### `app/_layout.tsx` — root startup made intentionally minimal
- Removed `expo-splash-screen` import and all `preventAutoHideAsync()` / `hideAsync()` calls.
- Removed `expo-font` / `useFonts()` import and the startup font gate.
- Removed root-level `initPurchases()` call.
- Root layout now renders the navigator immediately inside `SafeAreaProvider`.
- Goal: no optional native module invocation should happen from the root file before the app can render.

#### `app/index.tsx` — entry screen simplified to redirect-only
- Removed the dead sample reading preview UI. It was unreachable because the screen always redirects after checking stored profile.
- Removed startup `Animated.timing(... useNativeDriver ...)`.
- Entry screen now only checks for a stored profile and redirects to `/detail` or `/onboarding`, with a plain background while it checks.
- Goal: avoid starting NativeAnimated or building preview components during the first launch window.

#### `src/lib/purchases.ts` — RevenueCat lazy configuration
- Added `ensurePurchasesConfigured()` and moved RevenueCat configuration into purchase/status/offerings/restore calls.
- Paywall and restore still work, but RevenueCat is no longer initialized from `_layout.tsx` at app startup.
- Purchase is still blocked unless real packages load.

#### `src/components/ProfilePhotoCapture.tsx`, `app/onboarding.tsx`, `app/settings.tsx`
- Removed static `expo-image-picker` imports from onboarding/settings/photo capture module load.
- `ProfilePhotoCapture` now dynamically imports `expo-image-picker` only when the user taps `Take photo`.
- Face camera selection now passes a simple `"front"` value into the component.

#### `src/lib/notifications.ts`
- Removed static `expo-notifications` import.
- Notification APIs are dynamically imported only when scheduling or cancelling a reminder.
- If the module is unavailable, reminder scheduling returns `unsupported` instead of affecting launch.

#### `src/styles/theme.ts`
- Updated font comment to reflect that the app no longer blocks launch on font loading.

#### Verification status
- `/usr/local/bin/npm run typecheck` passes.
- `PATH=/private/tmp:$PATH /usr/local/bin/npm test` passes: 2 files, 18 tests.
- `git diff --check` passes.

#### Build guidance
- Do not resubmit rejected build `1.0.0 (9)`.
- Commit these changes, create build `1.0.0 (10)` or newer, upload it to App Store Connect, and submit that build for review.
- Reply to Apple: "We removed optional native module calls from app startup, including splash-screen control, startup font loading, startup purchase initialization, and static camera/notification module loading. The app now renders first and loads those native modules only when the related feature is used."

---

### 4d. UX/UI Polish Pass (2026-05-07)

Full detail-screen audit and polish. No feature changes; all immutable design rules preserved.

#### `app/detail.tsx`
- **Brand row**: Changed from row to column layout. Replaced "Daily luck dashboard" subtitle with `formatReadingDate(reading)` — date/lunar date/solar term now appears directly under "LuckyDay" in the header.
- **Page title**: `fontSize` 28 → 22. Score orb is now the clear visual headline.
- **Orphaned date Card removed**: The `<Card style={styles.top}>` block (date + solar term, mid-scroll) was redundant with the brand row date. Deleted entirely.
- **Score context + influence chips merged**: `breakdownRow` (3 qualitative chips) moved inside `scoreContextCard` with a divider. One border, one visual unit.
- **Lucky metrics layout**: Direction card no longer takes a lonely full-width row. Color card stays wide-left (flex: 3); Number and Direction stack vertically in a right column (flex: 2). No content removed.
- **Noise text removed**: Three meta-instruction strings deleted — almanac source attribution, "A quick read first…" (insights section), "Use this window for your most important small move." (best time card).
- **Action card body text**: `fontFamily` `fonts.bold` → `fonts.regular`, `fontWeight` '800' → '500'. Reads as a suggestion, not a command.
- **Score band opacity**: Inactive band labels (REST/STEADY/STRONG/PEAK) 0.45 → 0.6. Now legible at normal viewing distance.
- **Header gap**: `brandRow` gap 2 → 6px. LuckyDay and date line have breathing room.
- **"TODAY'S TOP INSIGHTS" label**: `fontSize` 18 → 13, added `textTransform: 'uppercase'`, `letterSpacing: 0.8`. Now matches the app's all-caps label convention.
- **Color swatch**: Border changed from `colors.luckyGold` to `colors.ink` (width 2), added subtle drop shadow. Light colors (Silver, White) now assert themselves on the pink card background.

#### `src/components/EnergyScoreCard.tsx`
- **Removed `label` prop**: "TODAY'S LUCK ENERGY" pill removed. Two label pills in one card was one too many.
- **Reordered card content**: Orb (number) is now first inside the card, followed by mood pill, then the message sentence. Previous order was label → sentence → number, which buried the score. New reading order: number → mood → message.
- **Removed `energyHelp` text**: "Luck energy is your simple daily momentum signal." was onboarding copy that never left. Deleted.
- **`energyMood` decoration fix**: "✦ Peak energy today" → "Peak energy today". Consistent with all other mood labels.

#### `src/components/TabBar.tsx`
- "Profile" → "You". Matches the app's personal fortune register.

#### `app/home.tsx`
- Updated `EnergyScoreCard` call to remove the now-deleted `label` prop.

#### Fourth pass fixes (2026-05-07, post third browser review)
- Lucky Color card: switched from `flexDirection: row` (left-anchored swatch+text) to `flexDirection: column` with `alignItems: center` + `justifyContent: center`. Swatch on top, label/name/meaning centered below. All 4 browser review crops now pass.

#### Third pass fixes (2026-05-07, post second browser review)
- `quickCopy`: `flex: 1` → `flexShrink: 1` — `flex: 1` absorbed all space, making `justifyContent: center` on the color card a no-op. Now the [swatch + text] group actually centers.
- `streakRow`: switched from `flexDirection: row + flexWrap` to column with `alignItems: center` — pill and milestone hint now reliably center-stack.
- Added `influencesLabel` ("WHAT SHAPED TODAY") above the influence chips inside `scoreContextCard` — makes the merged score+chips card semantically coherent.
- `deepDiveTitle`: added `✨` emoji prefix to match the emoji-label convention used throughout the app.

#### Second pass fixes (2026-05-07, post browser review)
- "DO THIS TODAY" label → "TRY THIS TODAY" (suggestion not command)
- `streakRow.marginTop`: `-spacing.xs` → `spacing.xs` (removes overlap with hero card bottom edge)
- `quickCopy`: added `justifyContent: 'center'` (vertically centers Lucky Color card text)
- `directionQuickCard`: added `alignItems: 'center'` + `justifyContent: 'center'` (matches Number card alignment)
- `colorSwatch`: `borderWidth` 2→3, `shadowOpacity` 0.18→0.3, `elevation` 2→4 (Silver/light colors now pop on pink background)

#### Verification (2026-05-07)
- `npm run typecheck` passes.
- `npm test` passes: 2 files, 18 tests.

---

### 4e. RevenueCat Setup + Price Alignment (2026-05-07)

**RevenueCat dashboard fully configured:**
- Project: LuckyDay
- iOS API key: `appl_NGvyaLeLFXBfpaNUVjaKDGvgSo` ✅
- Bundle ID: `com.santipap.luckyday` ✅
- Products added under iOS app: `com.luckyday.premium.monthly`, `com.luckyday.premium.annual` ✅
- Entitlement `premium` linked to both iOS app products ✅
- Offering `default` set as Current with `$rc_monthly` and `$rc_annual` packages ✅

**Price alignment:**
- Resolved discrepancy between docs ($2.99/$14.99) and code ($4.99/$29.99)
- Final pricing: **$4.99/month · $19.99/year**
- Updated: `docs/APP_STORE_LISTING.md` and comment in `src/lib/purchases.ts`
- **Action required:** Update `com.luckyday.premium.annual` price in App Store Connect from $29.99 → $19.99

**Screenshots captured (web preview, all 5):**
- Today screen (score 61, Soft Steady Luck, 15-day streak, Mali profile)
- Lucky metrics (Best Time, Good/Avoid, Lucky Color/Number/Direction)
- Insights (Watch For, Love, Money)
- History (15-day streak, 79 avg energy, May 2026 calendar)
- Paywall ("Make every morning feel chosen", features list)
- Note: Web screenshots are preview only. Final App Store screenshots need iPhone device or Xcode Simulator (portrait, 1290×2796 or 1320×2868).

---

### 4h. Build 14 Cycle — Repositioning + Premium-Feel Features (2026-05-09 → 2026-05-14)

Apple rejected Build 13 under Guideline 4.3(b) (saturated category / fortune-telling clone signal). Response strategy: reposition LuckyDay as a *Chinese Almanac daily ritual* rather than a "luck reading" app, and ship premium-feel cultural depth that an off-brand clone could not produce.

#### Repositioning commits
- `8736ad9 fix: strip 'luck'/'fortune' user-facing copy for 4.3(b) repositioning` — replaced visible "luck"/"fortune" framing with almanac language across detail/onboarding/paywall/settings/share copy.
- `f13d08c fix: strip Chinese characters from all displayed UI` — full English-only sweep for App Review accessibility; Chinese remains in translation table keys only (`src/lib/almanac.ts`).
- `8736ad9` (paired) — paywall + share copy realigned to "almanac ritual" positioning.

#### Cultural depth features
- `a6fea7c feat: auspicious-day badge — surface the 6 黄道日 in English` — gold sunrise pill below the date chip on the 6 lucky day-gods/cycle (Green Dragon, Bright Hall, Golden Vault, Heavenly Virtue, Jade Hall, Master of Destiny). One-line English meaning + VoiceOver label. **No badge** on inauspicious days — never tells the user "today is bad". Powered by `lunar-javascript` `getDayTianShen()`; new `src/lib/auspiciousDay.ts` module + Vitest suite.
- `bc13f00 feat: solar term countdown, real reading in notifications, midnight rollover` — countdown to next solar term, push notification body now includes today's actual reading first sentence, midnight rollover refreshes detail screen automatically.
- `af8f367 feat: Chinese double-hour chip, Reduce Motion respect, VoiceOver labels` — 子/丑/寅 etc. double-hour chip, Reduce Motion accessibility setting honored across animations, VoiceOver labels added across detail screen.

#### Retention / ritual loop
- `a29b154 feat: live best-time progress, streak milestones, time-aware greeting` — live progress bar showing how close best-time window is, streak milestone celebration modals, time-aware greeting on detail screen.
- `772b35f feat: streak save warning — late-night push + at-the-wire celebration` — daily 21:30 push when streak ≥ 1 ("Your N-day streak holds until midnight"), and an in-app "✦ Streak saved with Xh Ym to spare" pill when user opens during the danger window. Auto-cancels when streak drops to 0; reuses morning-reminder permission (no re-prompt). New `STREAK_SAVE_NOTIFICATION_KEY`.
- `c8bb151 feat: settings toggle for streak-save push reminder` — per-channel Switch under Morning reminder so users can disable just the 21:30 push without losing the morning one. New flag `luckyday.streakSavePushEnabled.v1` (default on); `syncStreakSaveReminder` honors it. Defends against any App Review concern about multi-notification apps lacking per-channel control.

#### Accessibility — Dynamic Type
- **Dynamic Type scaling** (922ac04) — body text now honors iOS text-size accessibility setting up to a 1.6× ceiling, set globally via `Text.defaultProps.maxFontSizeMultiplier` and `TextInput.defaultProps.maxFontSizeMultiplier` in `app/_layout.tsx`. Score number + `/100` unit pinned to 1.0× (must stay inside the 132×132 orb); mood pill capped at 1.2×. Completes the a11y trifecta with Reduce Motion and VoiceOver shipped earlier in the cycle.

#### Onboarding — "Consulting the almanac" reveal
- **First-reading reveal overlay** (91f4f35) — new `src/components/AlmanacReveal.tsx` plays a 1.5s sequenced animation after the user finishes onboarding and before the first reading loads: sparkles fade in (400ms) → 5 element dots (Wood/Fire/Earth/Metal/Water) ring fade-and-scale around a center point (500ms) → champagne-and-gold orb scales up with title "Consulting the almanac…" (500ms). Renders as a full-screen overlay over the onboarding Screen. Reduce Motion: skips the animation, holds the final frame for 250ms, then navigates. Wired in `app/onboarding.tsx` `saveProfile()` — sets `revealing` after `saveStoredProfile`/`syncLocalDailyReminder` resolve, then `router.replace('/detail')` fires from the reveal's `onDone`. Day-1 perceived-premium moment without blocking the data save path.

#### UI/UX polish pass — retention + ritual sharpening (designer audit)
- **Tomorrow preview replaces dead "come back tomorrow" copy** (`app/home.tsx`) — `tomorrowCard` now computes tomorrow's score via a second `generateDailyReading(profile, tomorrowDate)` call on focus and renders `Tomorrow: <Tier>` with delta-aware copy ("A clear lift incoming", "A softer day ahead", "Quieter pace tomorrow"). Closes the open loop the previous copy left dangling.
- **Action card re-pitched as ritual** (`app/detail.tsx`) — label changed from "🍀 Try this today" to "🍀 Your ritual for today"; body text bumped to `fontSize: 20`/`fonts.bold` so the most actionable card stops drowning beside the 6 other cards on screen.
- **Score band colors brought on-brand** (`app/detail.tsx`) — replaced 5 random pastels (`#EDE9F8`/`#E8F2FF`/`#E8F8EE`/`#FFF8E0`/`#FFF0E8`) with a uniform `colors.blush` inactive base; active band swaps to `colors.champagne` with a `colors.luckyGold` glow shadow. Sharpens premium feel mid-ritual.
- **Lucky color ritual line** (`app/detail.tsx`) — new italic mauve sub-line under the color swatch: "Wear or carry [color] today to align your energy." Off-device behavior tied to the app — strongest known habit-formation mechanism, zero infrastructure.
- **Accuracy celebration state** (`app/history.tsx`) — when `predictionMatched / predictionDays >= 0.6` (and at least 2 reflected days), the AccuracySummaryCard renders a champagne hero block with mauve `26px/heavy` "X of Y days matched" + "The almanac tracked your reality this week." Promotes the proof-of-value moment from a tiny pill to the full card.
- **TabBar "You" → "Settings"** (`src/components/TabBar.tsx`) — silent day-1 navigation confusion eliminated.
- **Cuts** — duplicate `moonStrip` removed from `app/home.tsx` (moon phase already shown in detail insights + almanac card); `sharePromptCard` removed (defensive copy "No private details" undermined premium feel; one share button below now owns the surface). Net diff: less competing visual noise on home screen.

#### Post-preview review fixes — moving tomorrow card to /detail + polish
- **Tomorrow preview card moved to `app/detail.tsx`** (current commit) — critical finding from external review: `TabBar` routes "Today" tab to `/detail`, not `/home`, so the tomorrow preview I shipped in `home.tsx` was effectively dead code for the primary daily flow. Ported to detail.tsx with full visual treatment: emoji + uppercase muted label + bold mauve tier + delta arrow (e.g. "Strong day ↑8") + body copy. Lives just above the share CTA so it bookends the screen.
- **Web share double-tap crash fixed** (`shareReading` + `isSharing` state) — `Share.share` on web maps to `navigator.share` which throws synchronously on concurrent invocation, tripping the ErrorBoundary. Added `isSharing` guard + `try/catch` + `.catch(() => undefined)` wrapping; button visually disables while in flight.
- **Action card label receded** (`app/detail.tsx`) — `actionLabel` color changed from `colors.champagne` (loud yellow-green) to `rgba(255,255,255,0.55)` so the mauve hero card lets the bold ritual text hit first, not the screaming label.
- **Score bands inactive contrast bumped** (`app/detail.tsx`) — removed `opacity: 0.6` from the `scoreBand` style and switched inactive label color from `colors.muted` to `colors.mauve @ 0.65 opacity`. Inactive bands now readable against the blush base.
- **Share button copy rewritten** — "Share today's reading" (transactional, CSV-sounding) → "Send today's almanac ✦"; a11y label matches.
- **Streak copy reframed away from gamification** (`getStreakLabel` + milestone hint) — "Day 1 ritual streak" → "Your first day back"; "X days to your N-day milestone" → "X more days opens a new chapter". Closer to ritual register, away from Duolingo.
- **Settings page title aligned** (`app/settings.tsx`) — "Profile ✨" → "Settings ✨" to match the tab bar label rename shipped earlier.

#### Action body weight + always-on day-type slot
- **Action card body bumped to 22px / fonts.heavy / fontWeight 900** (`app/detail.tsx`) — review-2 flagged that the most-important sentence on the screen visually read at the same weight as the journal body below. Now the only-thing-at-full-white-weight contrast lands as intended; the recessed translucent label leads, the body hits hard.
- **Neutral day-type fallback in the auspicious badge slot** (`app/detail.tsx`) — review-2 ask: "on non-auspicious days show the neutral day type in the same slot so the hierarchy always exists." New `getNeutralDayCopy(moonPhase)` helper maps each of the 8 lunar phases to a short label + actionable line (e.g. "Quiet day · New Moon — A fresh page. Begin small." / "Resting day · Waning Crescent — Conserve. Strain costs more today."). Renders with new `neutralBadge` styles: same shape as the auspicious badge but softer palette (`panelStrong` bg, `roseGold` border, muted label) so the gold treatment still pops on actual auspicious days. Slot is now always filled — users learn to trust it, and the contrast on auspicious days lands harder.

#### Pass-3 review fixes — 6 ship-blockers + ritual chime
- **Onboarding Continue button no longer silently fails on web** (`app/onboarding.tsx`) — `Alert.alert` is a no-op in some Expo web configs, so a user who tapped Continue without entering a nickname was stuck silently. New `notify()` helper falls back to `window.alert()` on web and keeps native `Alert.alert` for iOS/Android. All 4 validation paths route through it.
- **Ritual tap button affordance fixed** (`app/detail.tsx`) — reviewer flagged that the resting state looked already-disabled (faint outline) and the done state looked nearly identical. Now: resting = warm `luckyGold` fill with `goldDeep` heavy text + `champagne` border (obviously tap-me); done = quiet translucent ghost (obviously different). Pressed state also gets a 0.98 scale.
- **Ritual sparkle dwell extended** — review found the 280ms ramp was invisible on web. Now ramps 320ms → 600ms hold at peak → 600ms fade. Sparkle font bumped 22px → 32px with a champagne text-shadow halo. Scale interpolation widened to 0.5 → 1.6 so it noticeably blooms.
- **Soft chime on ritual tap** (`src/lib/chime.ts`) — new `playRitualChime()` helper. Web: synthesizes a 2-note C5+E5 sine bowl-strike via Web Audio API (~600ms, attenuated, no asset). Native: no-op for now — proper iOS/Android implementation pending audio assets + expo-av. Reviewer's pick: "single highest emotional multiplier per line of code." Wired into `handleRitualTap` directly after state update.
- **History streak hint copy aligned** (`app/history.tsx`) — was still showing the old gamified `"X days to N-day milestone"` while detail.tsx had been reframed to "A few more mornings opens a new chapter." Both surfaces now use the same copy.
- **Tomorrow swatch white-color guard** (`app/detail.tsx`) — single gold-bordered swatch on a near-white background looked like a missing image when the lucky color was white/cream. Now double-ringed: outer `luckyGold` 52×52 + inner `roseGold` 44×44 with the color fill. White-on-white now reads as deliberate structure.
- **Journal placeholder voice unified** — label says "What's on your mind today?", placeholder said "A line for your future self…" — two different promises. Now placeholder echoes the label voice: "A line for today…" (still shifts to "How did it go?" after ritual completion).
- **Web share fallback now covers `NotAllowedError`** (`app/detail.tsx`) — review found that desktop Chrome has `navigator.share` but rejects without a user gesture, so the silent-fail path persisted. Refactored to check error.name in the `.catch` and surface the same fallback alert for `NotAllowedError`. `AbortError` (user cancelled) stays silent.

#### Ritual completion tap — closes the open loop
- **"I did this today ✓" button inside the action card** (`app/detail.tsx`) — reviewer's recommended next feature: "the one touch that would make returning tomorrow feel meaningfully different from today." Translucent champagne pill at the bottom of the mauve action card. On tap: (a) ritual text gets a 60% opacity strikethrough, (b) the button swaps to a lucky-gold-tinted "✓ Done — well done" disabled state, (c) a 280ms+520ms `✦ ✧ ✦` sparkle fades in/out from the top-right of the card, (d) the journal field auto-focuses with placeholder shifting to `"How did it go?"`. Closes the loop the app currently dangles open: tell user to do something → ask if they did → invite the reflection.
- **Storage** (`src/lib/storage.ts`) — new `RITUAL_DONE_KEY = 'luckyday.ritualDone.v1'` backing a `Record<date, boolean>` map. APIs: `getRitualDone(date)`, `setRitualDone(date, done)` (deletes when false to keep the map sparse), `getAllRitualDone()`. State persists across session restarts so the user sees the done state on revisit.

#### Post-review-2 polish pass — magic-trick gating, journal hierarchy, tomorrow swatch, hierarchy sweep
- **Magic-trick gating + zodiac emoji + entrance animation** (`app/onboarding.tsx`) — review found that `BirthdayPicker` auto-emits `1990-01-01` on mount, so the preview card was already visible before the user did anything. Added `hasTouchedBirthday` state — only flips true when the picker emits a value other than the default. Swapped the element emoji for the proper zodiac-animal emoji from `getChineseZodiacDetails(animal).emoji` (🐎 Horse, 🐲 Dragon, etc.) for stronger almanac feel. Added a 320ms parallel fade-up + translateY animation so the card visibly appears.
- **Journal hierarchy fixed** (`app/detail.tsx`) — review found the journal floated visually disconnected from the action card and the in-input label vanished on type. Wrapped the input in a new `journalGroup` View with a 6px-gap external `journalLabel` ("What's on your mind today?") rendered ABOVE the field. Bumped the input card border from rose-gold to lucky-gold (matches the magic-trick + tomorrow card border language). Tightened margin to action card above.
- **Tomorrow preview swatch** (`app/detail.tsx`) — replaced the stock 🌅/🌙/✨ emoji with a 44×44 lucky-gold-bordered color swatch showing tomorrow's lucky color. Sneak preview of color change feels like insider info, not a stock emoji. Refactored state from `tomorrowScore: number | null` → `tomorrowReading: DailyReading | null` (we already had the full reading; just needed to keep it).
- **Reflection prompt subordinated** (`app/detail.tsx`) — review flagged that the prompt looked identical in weight to the action card. Smaller padding, softer 1px rose-gold border on `panelStrong` background instead of 1.5px luckyGold on `panel`. Added a "Before today" 10px uppercase kicker so the user reads it as backwards-glance, not today's main guidance.
- **Streak hint reframed** (`app/detail.tsx`) — review wanted the explicit countdown blurred. `"X more days opens a new chapter"` → `"Tomorrow opens a new chapter"` when 1 day away, else `"A few more mornings opens a new chapter"`. Removes the gamification residue.
- **Best Time hierarchy** (`app/detail.tsx`) — review flagged 3 competing status lines. Receded "BEST TIME" label (12px→11px, 0.75 opacity, no caps), bumped `bestTimeValue` 28px→32px + `fonts.heavy`, dropped uppercase + letter-spacing on `bestTimeHint` and softened to fontWeight 500 secondary text.
- **Header chip uppercase dropped** (`app/detail.tsx`) — `solarTermChip` ("6 days until Grain Buds") + `doubleHourChip` ("Monkey Hour · 3-5pm") no longer scream. Letter-spacing 0.4→0.2.
- **History heading uppercase dropped** (`app/history.tsx`) — `statsHeading` "Your readings at a glance" no longer all-caps + tracked.

#### Reading-soul Wk3 audit — chineseZodiac.ts (5 strings refined across 4 animals)
- **Rat** — `'Adaptability is your superpower. Embrace the change coming your way.'` → `'A small change to your morning plan opens room for the better thing showing up by mid-afternoon. Stay loose.'` (added time anchor: morning → mid-afternoon).
- **Tiger** — `'Your fire energy attracts the right attention today — use it well.'` → `'You walk into a room this morning and people pay attention before you speak. One direct question gets you what you came for.'` (replaced astrology-speak with concrete morning scene + actionable verb).
- **Rabbit** — `'Your sensitivity is a strength, not a weakness. Trust it.'` → `'Notice the small mood shift in the room before lunch — you read it correctly. Adjust your approach and the rest of the day flows.'` (defensive affirmation → concrete observation + time anchor).
- **Rabbit** — `'Good things come to those who move with grace and intention.'` → `'A slow start to the morning serves you better than rushing in. The first calm hour decides the next eight.'` (fortune-cookie → specific morning ritual).
- **Dragon** — `'Fortune responds to the Dragon\'s belief in itself. Believe completely.'` → `'The "yes" you have been practicing in your head — say it out loud before noon. The opening you wait for is the one you create.'` (tautology → concrete inner-monologue moment + noon anchor).

#### Daily journal — strongest churn defense
- **One-line journal field on `app/detail.tsx`** (current commit) — new `Card` directly under the action card with copy `"What's on your mind today?"` + a multiline `TextInput` (placeholder: `"A line for your future self…"`). Auto-saves on blur via the new `setJournalEntry(date, text)` storage helper. Hydrates on focus via `getJournalEntry(reading.date)`.
- **Storage** (`src/lib/storage.ts`) — new `JOURNAL_KEY = 'luckyday.journal.v1'` backing a `Record<date, string>` map. APIs: `getJournalEntry(date)`, `setJournalEntry(date, text)` (deletes when trimmed empty), `getAllJournalEntries()`. Empty trims clean up the key — no garbage entries.
- **History surface** (`app/history.tsx`) — `getAllJournalEntries()` now loads alongside readings + feedback; each `HistoryCard` accepts an optional `journal` prop and renders the saved entry in italic ink as `"<entry>"` between the action row and the reflection row. Personal artifacts surfaced where users browse their past = strongest possible churn defense (users don't delete an app that holds their own words).

#### Onboarding magic-trick + today-tinted background — day-1 + every-day delight
- **Birthday preview card on onboarding step 2** (`app/onboarding.tsx`) — the moment a valid birthday is entered, a champagne-bordered card appears under the BirthdayPicker showing `[element emoji] · Year of the [Animal] · [Element] element · "The almanac already knows you"`. Uses `getChineseZodiac()` + `getZodiacElement()` already on disk. Fires *during* onboarding, before the user has committed anything — day-1 "this knows me" moment.
- **Today-tinted background wash** (`src/components/Screen.tsx` + `app/detail.tsx`) — new optional `tintColor` prop on `Screen` renders a 7% opacity full-screen wash above the existing aura layer and below the ScrollView content. Detail.tsx passes `getLuckyColorHex(reading.luckyColor)`, so the entire today-screen subtly absorbs today's lucky color. The app *feels different* when their color is silver vs. red without anyone consciously noticing why — magical without being obvious. Other screens unaffected (no tint passed).

#### Share-card vertical Story redesign — almanac framing
- **`src/components/LuckyShareCard.tsx`** (current commit) — the share card is the app's only viral surface; redesigned to anchor every shared image in the almanac brand. Added: (1) a translucent champagne inner border ring inside the 5px gold outer border for an almanac-scroll feel; (2) a gold solar-term banner at the top of the card when today is one of the 24 节气 (renders `reading.solarTerm`, English-only); (3) a lunar-date subtitle under the main date; (4) an auspicious-day ribbon below the date that replaces the generic "A little luck for today" pill when today qualifies as one of the 6 黄道日 (uses `formatAuspiciousBadgeLabel(getAuspiciousDay(...))`, English-only); (5) wordmark subtitle changed from "Generated by LuckyDay" → "The Chinese Almanac, daily" — positions the brand once, ritual-first. Card preserves its 360×640 → 9:16 capture aspect so iOS Stories crop naturally.

#### Weekly pattern card — day-7+ stickiness driver
- **"Your last N days" chip row on `app/detail.tsx`** (current commit) — when `getStoredReadingHistory()` returns ≥5 of the past 7 days (today + 6 prior), a champagne-bordered card renders just above the yesterday-reflection prompt with colored count chips in ascending-energy order: `[dot] N rest · [dot] N steady · [dot] N good · [dot] N strong`. Strong + Peak collapsed into one chip (visual simplicity). New `WeekPattern` type + `bucketWeekPattern` + `formatWeekPatternParts` helpers. Dot colors map to the brand palette: rest=faint, steady=mauve, good=roseGold, strong=goldDeep. **Why this card:** users who recognize their own energy patterns ("Mondays drain me, Fridays peak") form the strongest daily ritual habit. This is the missing surface — the data was already collected but never reflected back to the user.

#### ALL-CAPS density sweep — calm restored to mid-screen
- **Six section labels softened on `app/detail.tsx`** (current commit) — reviewer flagged that GOOD FOR / AVOID / WHAT SHAPED TODAY / TOP INSIGHTS / quick-card labels read like a spreadsheet, undermining the calm the orb earns at the top. Dropped `textTransform: 'uppercase'` and tightened `letterSpacing` from 0.5–0.8 → 0.2 on: `pillsLabel`, `breakdownLabel`, `influencesLabel`, `deepDiveTitle`, `quickLabel` (Color / Number / Direction), `tomorrowLabel`. Bumped a couple sizes up 1px for legibility now that they're not stretched by caps. Kept uppercase intentionally on badge-style elements (auspicious, solar term, best-time, reflect CTA, action card kicker, score-band tier abbreviations) where caps is the genre convention for short pill labels.

#### Yesterday-reflection prompt — feeds the accuracy loop
- **One-tap reflection card on `app/detail.tsx`** (current commit) — when the most-recent past reading has no feedback recorded AND local hour ≥ 8, a champagne-bordered prompt renders directly above the action card: `"Yesterday was a [Tier] day"` + `"How did it actually feel? · 30 seconds"` with a mauve "Reflect" CTA. Tap → `router.push({ pathname: '/feedback', params: { date: yesterdayDate } })`. New helper `getReadingTierLabel()` maps score → Peak/Strong/Good/Steady/Rest. Imports `getFeedbackForDate` from storage; `setYesterdayPrompt(null)` on tap dismisses immediately for snappy navigation. **Why this matters:** the new accuracy celebration block in `history.tsx` only fires when ≥2 reflected days exist with ≥60% match rate. Without surfacing reflection in the daily flow, that hero state stays dark for most users. This card is the missing input pipe.

#### Reading-soul audits (Routine 7)
- `52961c1 copy: reading soul audit Wk1 — luck.ts — 3 strings refined` — first audit pool: main daily messages, action sentences, score-band copy. 3 lowest-scoring strings rewritten with concrete imagery + time-of-day anchors.
- `592fead copy: reading soul audit Wk2 - almanac.ts - 3 strings refined` — second audit pool: yi/ji guidance. Tracker at `docs/reading-soul-rotation.md`; per-week audit files under `docs/reading-audits/`.

#### Polish + a11y
- `c211a4e style: align streak pill spacing` — visual rhythm fix.
- `87cd29c [a11y]: expand paywall close target` — reach-target compliance.
- `acc5d86 fix: bump faint contrast to WCAG AA, align quickCard radius to scale` — `colors.faint` darkened to meet WCAG AA on petal-blush background.
- `baea011 fix: zodiac emoji uses lookup map, remove default focus selection` — bug fix for emoji rendering + onboarding bias.

#### Automation / infrastructure
- `1404ab7 chore: add sync-main weekly routine + README updates` — weekly routine to keep `main` current with the polish branch.
- `9ec979a chore: add daily-log script + launchd setup notes` — `scripts/daily-log.sh` writes daily commit summary to `docs/daily-log.md` so the GitHub contribution graph mirrors actual work.
- `c788112 docs: daily-log entry 2026-05-14` — log artifact.
- 9-routine automation system live (see Section 8 below).

#### Test coverage
Tests grew **43 → 94** (3 → 9 test files):
- New: `auspiciousDay.test.ts`, plus expanded coverage across notifications/streak/luck pools.

#### Build status
- Build 14 submitted with the repositioning + the features above. Awaiting Apple verdict (as of 2026-05-14 23:00 CDT).
- Branch: `codex-luckyday-product-polish`. Working tree clean. Pushed to GitHub.

#### Verification (2026-05-14)
- `npx tsc --noEmit` — zero errors
- `npm test` — 94/94 passed (8 test files)

---

### 4g. Build 11 — JS Crash Containment (2026-05-08, post-rejection)

Build 10 was rejected at 12:07 AM on 2026-05-08 (iPad Air 11-inch M3 / iPadOS 26.4.2, Guideline 2.1(a)). All three crash logs are identical: triggered thread queue is `com.facebook.react.ExceptionsManagerQueue`, exception type `EXC_CRASH/SIGABRT`, terminator `abort()`. The `hades` (Hermes GC) thread is alive — JS bundle parsed and executed before throwing.

**Conclusion:** Build 10's native-side lazy-load mitigation worked. The new crash is a **JS-level unhandled exception** that React Native's fatal handler converts to native abort. iPad-only (iPad15,3 in every log).

Without the dSYM + sourcemap, the exact JS line cannot be extracted from the crash log. Build 11 ships a containment layer instead of guessing the root cause.

#### `src/lib/errorHandler.ts` — new
Installs a global JS error handler via `ErrorUtils.setGlobalHandler`. Persists the most recent error to `AsyncStorage` under `luckyday.lastError.v1` (message, stack, isFatal, timestamp), then forwards to the previous handler in **non-fatal mode** so the process does not abort. Also catches unhandled promise rejections defensively. Idempotent — safe across hot reload. Exports `getLastError()` and `clearLastError()` for a future debug screen.

#### `src/components/ErrorBoundary.tsx` — new
Class component that catches **render-time** errors in its subtree (something the global handler cannot catch). Renders a fallback view ("Something interrupted your reading") with a Reload button that resets state. Persists the caught error to the same AsyncStorage key.

#### `app/_layout.tsx` — wire-up
- Calls `installGlobalErrorHandler()` at module load (top-level, before `RootLayout` is defined) so the very first child render is already covered
- Wraps the entire `<Stack>` tree in `<ErrorBoundary>`

#### Why this approach
Render errors and async errors are two distinct failure modes — we cover both. The global handler keeps the app alive when a useEffect throws or a Promise rejects unhandled; the ErrorBoundary keeps it alive when render itself throws.

**Trade-off:** containment hides the underlying bug. Sentry crash reporting is now wired (see below) — once `EXPO_PUBLIC_SENTRY_DSN` is set, every contained error is also sent to Sentry with a symbolicated stack trace. The persisted `luckyday.lastError.v1` becomes a redundant local fallback.

#### `src/lib/sentry.ts` — new (Sentry wrapper, env-gated, lazy)
Same pattern as `analytics.ts` and `purchases.ts`: dynamic `import('@sentry/react-native')` only fires after first paint, keeping Sentry's native module off the iOS launch path. Inert until `EXPO_PUBLIC_SENTRY_DSN` is set.

API: `initSentryAsync()`, `captureException(error, context)`, `captureMessage(message, level)`, `setSentryUser(userId)`.

Wired into:
- `errorHandler.ts` global handler → `captureException(error, { source: 'globalHandler' })`
- `errorHandler.ts` unhandled rejection → `captureException(err, { source: 'unhandledRejection' })`
- `ErrorBoundary.componentDidCatch` → `captureException(error, { source: 'ErrorBoundary' })`
- `_layout.tsx` `useEffect` → `initSentryAsync()` after first paint

#### `app.json` plugin
Added `"@sentry/react-native/expo"` to the `plugins` array. The plugin handles native iOS init and uploads sourcemaps during EAS build (when `SENTRY_AUTH_TOKEN` is set). Without the plugin, errors would be reported but stack traces would be obfuscated minified JS.

#### Activation steps (user action, not committed)
1. Create a free Sentry account at sentry.io → new React Native project
2. Copy the DSN
3. Add to `.env`: `EXPO_PUBLIC_SENTRY_DSN=https://...`
4. For EAS production: `eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://..."`
5. For sourcemap upload: `eas secret:create --name SENTRY_AUTH_TOKEN --value "..."` (org-level token from Sentry → Settings → Auth Tokens)
6. Next EAS build will upload sourcemaps automatically; first crash will appear in Sentry dashboard with the actual JS file/line/function

#### Build & submit
- EAS `autoIncrement: true` will assign build number 11 automatically.
- Run `eas build -p ios --profile production`, then `eas submit -p ios --latest`.
- After Apple approves, do **not** reply to the old rejection — submit fresh.

#### Verification (2026-05-08)
- `npx tsc --noEmit` — zero errors
- `npm test` — 43/43 passed (3 test files)

---

### 4f. Analytics + Test Coverage + Config Hardening (2026-05-08)

Build 10 is still in Apple review. This session added non-binary infrastructure (no new EAS build needed).

#### `src/lib/analytics.ts` — new file
Typed-event analytics wrapper backed by PostHog. Module is inert until `EXPO_PUBLIC_POSTHOG_API_KEY` is set, so call sites can be wired throughout the app without risk.

- **Event taxonomy:** 16 typed events covering lifecycle (`app_opened`, `onboarding_*`), reading flow (`reading_viewed`, `reading_shared`, `history_viewed`), monetization (`paywall_*`, `purchase_*`), and ritual (`streak_milestone_hit`, `reminder_*`).
- **API:** `initAnalytics()`, `track(event, properties)`, `identify(userId, traits)`, `setUserProperties(traits)`.
- **Lazy init:** dynamic `import('posthog-react-native')` only fires after the first `track()` call, keeping the native module off the iOS launch path. Same pattern as `purchases.ts`.
- **Privacy:** events are anonymous by default. `identify` should only be called with the device-local profile ID (no PII).

#### `src/lib/purchases.ts` — env-overridable key + funnel events
- `REVENUE_CAT_API_KEY` now reads `process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY` with the production key as fallback. Lets staging builds swap keys without code changes; production binary still works without env vars.
- `purchasePackage()` now emits `purchase_started`, `purchase_succeeded`, `purchase_cancelled`, `purchase_failed` (with `reason` properties) at every branch.
- `restorePurchases()` emits `purchase_restored` only when an entitlement is actually restored.

#### `app/_layout.tsx` — root-level `app_opened` event
Fires `track('app_opened')` from a `useEffect` in `RootLayout`. Runs after first paint, never blocks startup. Lazy-load pattern means the PostHog native module does not load until the user has cleared the launch path.

#### Test coverage: 17 → 43 tests
- **`src/lib/almanac.test.ts`** (new, 10 tests): lunarDate format, goodFor/avoid arrays + 3-item cap, determinism, known solar term on 2026-05-05 (立夏), ordinary day with no solar term, bilingual label format, invalid date fallback, cross-call consistency.
- **`src/lib/streak.test.ts`** (4 → 18 tests): streak break on gap, single-day streak, same-day duplicate dedupe, empty history, 10-day unbroken streak, all `getStreakMilestone` milestone values, non-milestone returns null, beyond-last-milestone returns null, `shouldRequestRating`, `getNextMilestoneTarget` boundary cases.
- **`src/lib/luck.test.ts`** (13 → 15 tests): cross-date score clamping (50–96, 28-day sample), determinism across multiple `generateDailyReading` calls on the same date+profile.

Intentionally untested: `getAlmanacDay` zero-translation fallback path (brittle to translation table updates) and `getMonthActivity` timezone edge cases (uses local time consistently; testing requires forced TZ).

#### Dependencies added
- `posthog-react-native ^4.44.4`

#### Verification (2026-05-08)
- `npx tsc --noEmit` — zero errors
- `npm test` — 43/43 passed (3 test files)

#### Commits (branch `codex-luckyday-product-polish`)
- `4add7b1 feat: add analytics scaffold, env-overridable RC key, expand test coverage`
- `1a2c8f4 feat: wire PostHog analytics with lazy init + app_opened event`

---

## 5. Known Issues / Remaining Gaps

### Pool content ceiling (~20 days)
After ~20 days, zodiac insight repeats will start. After ~60 days, some mainMessage repeats. The practical "feels fresh" window is 3–4 weeks with the current deterministic pool approach. The long-term fix is AI-generated per-reading content (requires a backend + API call + local caching). Do not block launch on this.

### Birth time and birthplace: collected, not used
`profile.birthTime` and `profile.birthplace` are stored but unused in reading calculation. They were collected for future features. Do not remove them from the data model or the onboarding UI. Do not tell users they affect the reading until they actually do.

### ~~RevenueCat production configuration needs final dashboard verification~~ — RESOLVED 2026-05-07
Dashboard fully verified: iOS key, bundle ID, both products under iOS app, `premium` entitlement, `default` offering with `$rc_monthly` and `$rc_annual` packages. Outstanding: StoreKit sandbox test on real device has not been done.

### App Store introductory offer not configured in code
The paywall does not claim a free trial. If you want "Try free for 7 days," configure the introductory offer in App Store Connect and RevenueCat first, then update paywall copy to reflect the real offer returned by the store package.

### Subscription metadata still in "Missing Metadata" state
Both `com.luckyday.premium.monthly` and `com.luckyday.premium.annual` show "Missing Metadata / Prepare for Submission" in App Store Connect. Display Name and Description appear filled, but the **review screenshot (1024×1024 PNG)** and **review notes** are likely missing — that is the typical blocker. If Apple validates IAP during Build 10 review (they sometimes do), this could trigger another rejection. Submit the subscription metadata for review independently of the binary; standalone subscription review is 24–48 hr and does not require a new build.

### Analytics dormant until API key is set
`src/lib/analytics.ts` is fully wired but a no-op until `EXPO_PUBLIC_POSTHOG_API_KEY` is added to `.env` (or EAS secrets for production builds). Sign up at us.posthog.com (free tier: 1M events/month). Set the env var, restart the dev server, and events flow with zero further code changes.

### Evening reflection reminder not yet implemented
Push notifications are already available for the morning reminder, but a separate 8 PM "How was your luck today?" reflection reminder should be added deliberately with its own storage key, cancellation behavior, settings copy, and opt-in/permission handling.

---

## 6. Next Steps — Build 14 Awaiting Verdict (Roadmap)

Build 14 is in Apple review under the new Chinese Almanac repositioning. While we wait, the polish queue below is ranked by impact-per-hour. Pick top-down unless verdict lands first.

### Roadmap (in priority order)

| # | Idea | Effort | Why now |
|---|---|---|---|
| 1 | ~~**Dynamic Type scaling**~~ ✅ shipped — fonts respect iOS text-size accessibility setting | half day | Done; bundles into Build 15 |
| 2 | ~~**Onboarding "consulting the almanac" reveal**~~ ✅ shipped — 1.5s sparkles → 5-element ring → orb overlay before first reading | 1 day | Done; bundles into Build 15 |
| 3 | **Share-card vertical Story redesign** — gold border, today's auspicious badge + solar term, almanac framing throughout | 2 days | Every shared card is the app's only viral surface |
| 4 | **App icon variant per element** — Wood/Fire/Earth/Metal/Water alternate iOS icons picked from user's Chinese element on first launch | 1 day | Identity hook; "this is mine" moment |
| 5 | **Reading-soul audits Wk3–Wk5** — chineseZodiac.ts, westernZodiac.ts, notifications.ts | 1h/week | Compounding content soul; on the Thursday rotation |
| 6 | **Bedtime reflection push** — daily 9 PM push → feedback screen | half day | DEFERRED — wait until Build 14 verdict + retention data justify a 3rd daily push channel |

Each shipped item must update this HANDOFF.md (Section 4 entry + ticking off the roadmap row) and push to GitHub on the same branch as the change.

### Apple-verdict-dependent next steps

**A. If Build 14 approved**
1. Update `com.luckyday.premium.annual` price in App Store Connect from $29.99 → $19.99 (the dropdown unlocks on approval).
2. Configure App Store + RevenueCat introductory offer (3-day free trial, annual only, new subscribers), then update paywall copy to reflect the real offer.
3. Submit subscription metadata for review (both Premium Monthly + Annual still in "Missing Metadata"). Subscription review is independent of binary, ~24–48 hr.
4. Run StoreKit sandbox pass on a real iPhone before announcing the launch.
5. Disable the `luckyday-review-watch` routine (verdict reached).

**B. If Build 14 rejected**
1. Read the rejection notice carefully — capture the guideline number + Apple's verbatim message in HANDOFF.
2. If 4.3(b) again: the repositioning was insufficient — escalate to a screen-by-screen Chinese Almanac re-skin (lunar phases, solar terms, yi/ji prominence over score).
3. If a fresh crash: pull the symbolicated crash log via Sentry (now wired) before guessing.
4. Do **not** reply to the rejection — submit a new build.

### Carry-over (pre-Build-14, still open)

**1. Submit subscription metadata for review — likely launch blocker**
Both subscriptions are stuck in "Missing Metadata / Prepare for Submission". For each (Premium Monthly, Premium Annual):
- Reference Name (`LuckyDay Premium Monthly`, `LuckyDay Premium Annual`)
- Subscription Group: `LuckyDay Premium` (group ID 22066284)
- Verify Display Name (`LuckyDay Premium`) and Description (`Full readings, lucky metrics & history.`) persisted
- **Review screenshot (1024×1024 PNG)** of the paywall — most likely missing field
- Review notes describing how to access the paywall in-app
- Annual: add introductory offer (3 days free, all territories, new subscribers)
- Hit "Submit for Review" — independent of binary; reviewed in 24–48 hr.

**2. Set `EXPO_PUBLIC_POSTHOG_API_KEY` to activate analytics**
Sign up at us.posthog.com (free tier: 1M events/month). Add to `.env`:
```
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key_here
```
For EAS production builds: `eas secret:create --name EXPO_PUBLIC_POSTHOG_API_KEY --value phc_…`. The first install with the key set will populate the dashboard with `app_opened`, `purchase_*`, and any other events wired in. No code change required.

**3. StoreKit sandbox test — do before app goes live**
Test the full purchase flow on a real iPhone using a sandbox Apple ID. Verify:
- Paywall loads pricing (not "We couldn't load App Store pricing")
- Monthly and annual packages appear
- Tapping a package triggers the StoreKit sheet
- Purchase completes and `isPremium()` returns true
- Restore purchases works
If any step fails, diagnose in RevenueCat dashboard logs before the app is live.

---

## 6.x. Build 12 / 13 archive (kept for continuity)

The original Build 12 next-steps block is preserved below for historical context. It was superseded by the Build 14 cycle in Section 4h.

### Original Build 12 Steps (Build 12 in EAS Queue — Auto-submitting to App Store Connect)

**Build 12 contains the crash containment layer and is queued in EAS.** Build 11 was consumed by a failed Sentry-plugin attempt (now reverted). Once Build 12 finishes (~10-15 min wall time) EAS will auto-submit to App Store Connect.

**0. After Build 12 finishes uploading to App Store Connect — top priority**
1. Open https://appstoreconnect.apple.com/apps/6766145777/distribution/reviewsubmissions
2. Click into the "Unresolved Issues" submission
3. Edit the existing item → swap the binary from Build 10 → Build 12
4. Click **Resubmit to App Review**

Do not reply to the original rejection message; submitting a fresh build is the standard response.

**1. Submit subscription metadata for review — likely launch blocker**
Both subscriptions are stuck in "Missing Metadata / Prepare for Submission". For each (Premium Monthly, Premium Annual):
- Reference Name (`LuckyDay Premium Monthly`, `LuckyDay Premium Annual`)
- Subscription Group: `LuckyDay Premium` (group ID 22066284)
- Verify Display Name (`LuckyDay Premium`) and Description (`Full readings, lucky metrics & history.`) persisted
- **Review screenshot (1024×1024 PNG)** of the paywall — most likely missing field
- Review notes describing how to access the paywall in-app
- Annual: add introductory offer (3 days free, all territories, new subscribers)
- Hit "Submit for Review" — independent of binary; reviewed in 24–48 hr.

**2. Update annual price in App Store Connect — do as soon as possible**
Change `com.luckyday.premium.annual` from $29.99 → $19.99. The edit dropdowns are disabled while Build 10 is in review and unlock on approval. Do not pull Build 10 from review just to change the price (loses queue position).

**3. Set `EXPO_PUBLIC_POSTHOG_API_KEY` to activate analytics**
Sign up at us.posthog.com (free tier: 1M events/month). Add to `.env`:
```
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key_here
```
For EAS production builds: `eas secret:create --name EXPO_PUBLIC_POSTHOG_API_KEY --value phc_…`. The first install with the key set will populate the dashboard with `app_opened`, `purchase_*`, and any other events wired in. No code change required.

**4. StoreKit sandbox test — do before app goes live**
Test the full purchase flow on a real iPhone using a sandbox Apple ID. Verify:
- Paywall loads pricing (not "We couldn't load App Store pricing")
- Monthly and annual packages appear
- Tapping a package triggers the StoreKit sheet
- Purchase completes and `isPremium()` returns true
- Restore purchases works
If any step fails, diagnose in RevenueCat dashboard logs before the app is live.

**5. If Apple rejects Build 10 again**
Read the rejection reason carefully. If it is another crash: pull the new crash log, identify the specific call site, remove or guard it, create Build 11. Do not guess — use the actual symbolicated crash log.

**6. Post-launch v1.1 priorities**
- Introductory free trial (configure in App Store Connect + RevenueCat, update paywall copy)
- Evening reflection reminder (8 PM push, separate storage key, opt-in UI)
- Wire remaining analytics events (`onboarding_*`, `paywall_*`, `reading_*`, `streak_milestone_hit`, `reminder_*`) — taxonomy is already declared in `src/lib/analytics.ts`
- AI-generated per-reading content (Supabase edge function + Claude API, cache by dateKey)
- Improved screenshot set (portrait device screenshots for next App Store update)

---

## 7. Immutable Design Rules

| Rule | Why |
|---|---|
| Never show raw score arithmetic in UI | Exposed formula made score feel fake in user testing |
| `home.tsx` is a loading-only redirect | `detail.tsx` is the primary screen; home is not a content screen |
| Tab bar on detail / history / settings only | Use `<Screen showTabBar>` on those three; plain `<Screen>` elsewhere |
| All content is deterministic per user per day | Seed = `hash(nickname\|birthday\|dateKey)`. Same user + same day = same reading. This is intentional. |
| Scores cap at 96, floor at 50 | 100 feels fake; below 50 feels punishing |
| Day-of-week variation uses prime multiplier 97 | Prevents offset collisions across categories |
| Element-aware pools replace, not blend with, general pool | Blending dilutes the element signal |
| `scoreReason` exists in data but is hidden | Display-only field for potential future use; never render it as text |

---

## 8. Automated Routine System (Live)

Nine scheduled routines run against this repo. Every routine reads `HANDOFF.md` first — keeping this doc current is the single highest-leverage maintenance task.

| # | Name | Cadence | Purpose | Output |
|---|---|---|---|---|
| 1 | luckyday-morning | Daily 8am | Health gate (test + typecheck) + 6-route screenshot baseline | `docs/screenshots/YYYY-MM-DD/` |
| 2 | luckyday-polish-lens | Daily 8:30am | Rotating visual lens (Mon Typography → Sun Personality; Fri = almanac voice) | One focused commit |
| 3 | luckyday-review-watch | Every 6h until verdict | Apple App Store status check on Build 14 | `docs/watcher-log.md` + alert |
| 4 | luckyday-accessibility-lens | Weekly Tue 9:15am | Tap targets, contrast, labels, overflow, disabled states | `docs/a11y-log.md` |
| 5 | luckyday-small-screen-sweep | Weekly Wed 9:15am | 375×667 / 390×844 / 430×932 layout check | `docs/screenshots/.../viewports/` |
| 6 | luckyday-competitor-mining | Weekly Wed 9:30am | App Store / Reddit harvest of competitor love/hate themes | `docs/competitor-insights/` |
| 7 | luckyday-reading-soul | Weekly Thu 9:15am | One content pool audited; 3 lowest-scoring strings rewritten | `docs/reading-audits/` |
| 8 | luckyday-apply-insight | Weekly Sat 9:15am | One filtered competitor insight applied to LuckyDay | `docs/applied-insights/` |
| 9 | luckyday-delight-audit | Weekly Sun 9am | Cold-open first-impression walkthrough; one flat thing fixed | `docs/delight-audit/` |

**Pause rule:** routines that affect the binary pause when Apple review is "Ready for Review" / "In Review" AND <48h since submission.

**Maintenance note:** if any routine produces a "Sandbox read-only" or "EPERM" log, the scheduler is missing write permissions for this folder. Grant project-folder write access before relying on automation output.

