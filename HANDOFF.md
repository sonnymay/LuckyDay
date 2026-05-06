# LuckyDay — Codex Handoff Document

**Last updated:** 2026-05-06
**Stack:** Expo SDK 54, React Native, expo-router ~6.0.23, TypeScript, RevenueCat IAP
**Target:** iOS App Store (primary). Android and Web secondary.

---

## 1. Current App Status

Feature-complete. **Build `1.0.0 (7)` was rejected again (Guideline 2.1a — App Completeness)** due to a launch crash on iPad Air 11-inch (M3) running iPadOS 26.4.2. The new crash logs still point at launch-time React exception handling. Current source now includes an additional splash-screen crash hardening fix (see Section 4a below). Do not resubmit build 7.

Pre-release checklist:

- [x] App Store crash mitigation 1 — `newArchEnabled` set to `false` in `app.json`
- [x] App Store crash mitigation 2 — `_layout.tsx` catches native splash-screen promise failures
- [x] New EAS production build created after crash/paywall fix — build `1.0.0 (8)` finished in Expo
- [x] Build 9 UX polish — birthday picker desync, coin label wrap, consent toggle, paywall copy (see Section 4b)
- [ ] Real iPhone / StoreKit sandbox pass for build `1.0.0 (8)` or newer
- [ ] Verify RevenueCat production app key, offerings, packages, and entitlement in the RevenueCat dashboard
- [ ] TestFlight upload and internal testing pass
- [ ] App Store screenshots (shot list in `APP_STORE_COPY.md`)
- [ ] App Store Connect listing (copy in `APP_STORE_COPY.md`)

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
- Build 7 rejection follow-up: wrapped `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync()` with catches so a native splash module exception/rejection on iPadOS 26 does not abort launch through React's exception manager.

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

## 5. Known Issues / Remaining Gaps

### Pool content ceiling (~20 days)
After ~20 days, zodiac insight repeats will start. After ~60 days, some mainMessage repeats. The practical "feels fresh" window is 3–4 weeks with the current deterministic pool approach. The long-term fix is AI-generated per-reading content (requires a backend + API call + local caching). Do not block launch on this.

### Birth time and birthplace: collected, not used
`profile.birthTime` and `profile.birthplace` are stored but unused in reading calculation. They were collected for future features. Do not remove them from the data model or the onboarding UI. Do not tell users they affect the reading until they actually do.

### RevenueCat production configuration needs final dashboard verification
`src/lib/purchases.ts` has a configured iOS public key and the visible paywall no longer shows fallback/test-only pricing. Before any EAS production build, verify in RevenueCat that this key belongs to the production app, the current offering is live, annual/monthly packages are mapped to App Store Connect products, and the `premium` entitlement unlocks correctly.

### App Store introductory offer not configured in code
The paywall does not claim a free trial. If you want "Try free for 7 days," configure the introductory offer in App Store Connect and RevenueCat first, then update paywall copy to reflect the real offer returned by the store package.

### Evening reflection reminder not yet implemented
Push notifications are already available for the morning reminder, but a separate 8 PM "How was your luck today?" reflection reminder should be added deliberately with its own storage key, cancellation behavior, settings copy, and opt-in/permission handling.

---

## 6. Recommended Next Steps (Priority Order)

**1. Commit and EAS build with current crash hardening (do this first)**
- `app.json` already has `"newArchEnabled": false`
- `app/_layout.tsx` now catches splash-screen startup failures
- `eas build --platform ios --profile production`
- Upload IPA to App Store Connect
- Respond to rejection: "We addressed an iPadOS 26 launch crash by disabling React Native New Architecture and hardening the splash-screen startup calls so native splash failures cannot abort launch. We submitted a new build for review."
- Do not resubmit build `1.0.0 (7)`.

**2. RevenueCat production key verification**
- Verify the configured key in `src/lib/purchases.ts` against RevenueCat dashboard
- Confirm current offering, packages, and `premium` entitlement are live
- Verify bundle ID `com.santipap.luckyday` matches exactly in RevenueCat
- Confirm build includes `react-native-purchases` before creating the next IPA

**3. App Store screenshots (est. 2–3 hours)**
Shot list is in `APP_STORE_COPY.md`. Run on simulator at 6.7" (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus). 6 screenshots total. Use a profile with score 85+ for the hero shot ("Peak energy" band should be highlighted). Frame the first screenshot as the full detail screen with a visually strong reading.

**3. Streak widget on detail screen (optional, pre-launch)**
`streak.ts` already computes the streak. Surfacing it on `detail.tsx` (e.g., "🔥 Day 7 streak" below the score) would add a retention hook without additional data collection. Keep it small — one line, not a prominent card.

**4. AI-generated per-reading content (post-launch)**
Long-term fix for the generic content ceiling. Architecture: call a backend edge function (Supabase or similar) on reading generation with zodiac, element, mainFocus[], and almanac data. Generate `zodiacInsight`, `westernZodiacInsight`, `money`, `love`, `work`, `health` via Claude API. Cache to AsyncStorage keyed by `dateKey`. Show a brief loading state (< 2s). This is the only complete fix for the personalization gap — the pool approach has a hard ceiling.

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
