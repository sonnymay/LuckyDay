# LuckyDay — Codex Handoff Document

**Last updated:** 2026-05-08
**Stack:** Expo SDK 54, React Native, expo-router ~6.0.23, TypeScript, RevenueCat IAP, PostHog analytics
**Target:** iOS App Store (primary). Android and Web secondary.

> **2026-05-08 02:30 — Build 10 REJECTED.** Apple rejected on iPad Air 11-inch / iPadOS 26.4.2 with the same Guideline 2.1(a) crash-on-launch. Crash signature: JS-thrown unhandled exception → `RCTExceptionsManager` → `objc_exception_rethrow` → `abort()`. **Not** a native module init crash anymore — Build 10's lazy-load mitigation worked at the native layer; the new failure is a JS-level exception escalating to fatal.
>
> **2026-05-08 03:08 — Build 12 in EAS queue.** Build 11 errored at the EAS Run-fastlane step because the `@sentry/react-native/expo` plugin tried to invoke `sentry-cli` for sourcemap upload without an org slug — there were no Sentry credentials configured yet. Plugin removed from `app.json`; runtime Sentry SDK still works (lazy import). Build number 11 was consumed by the failed attempt, so the next successful build is **#12**. Build 12 contains the Section 4g crash containment layer. EAS auto-submit to App Store Connect is scheduled.

---

## 1. Current App Status

**Build `1.0.0 (10)` REJECTED (2026-05-08, 12:07 AM).** Same Guideline 2.1(a) crash-on-launch, this time on **iPad Air 11-inch (M3) / iPadOS 26.4.2**. Three identical crash logs all show JS-thrown unhandled exception escalating to native abort.

**Build `1.0.0 (12)` is now in EAS queue (2026-05-08, 03:08 AM)** with the Section 4g crash containment layer (global JS error handler + React ErrorBoundary). Build 11 was consumed by a failed EAS attempt (Sentry plugin sourcemap upload error); the plugin has been removed from `app.json` and the runtime Sentry SDK remains in `src/lib/sentry.ts` as a lazy import. EAS auto-submit to App Store Connect is scheduled. Once the binary is in App Store Connect, click "Resubmit to App Review" with Build 12 selected.

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

## 6. Next Steps (Build 12 in EAS Queue — Auto-submitting to App Store Connect)

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
