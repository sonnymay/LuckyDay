# LuckyDay — Codex Handoff Document

**Last updated:** 2026-05-05
**Stack:** Expo SDK 54, React Native, expo-router ~6.0.23, TypeScript, RevenueCat IAP
**Target:** iOS App Store (primary). Android and Web secondary.

---

## 1. Current App Status

Feature-complete. **First submission was rejected (Guideline 2.1a — App Completeness)** due to a launch crash on iPad Air 11-inch (M3) running iPadOS 26.4.2. The crash has been diagnosed and fixed (see Section 4a below). A new EAS build is required before resubmitting.

Pre-release checklist:

- [x] App Store crash fixed — `newArchEnabled` set to `false` in `app.json`
- [ ] New EAS production build (`eas build --platform ios --profile production`)
- [ ] Verify RevenueCat production app key, offerings, packages, and entitlement in the RevenueCat dashboard
- [ ] TestFlight upload and internal testing pass
- [ ] App Store screenshots (shot list in `APP_STORE_COPY.md`)
- [ ] App Store Connect listing (copy in `APP_STORE_COPY.md`)

---

## 2. Architecture Overview

```
app/
  _layout.tsx        Root Stack navigator. Screens: index, onboarding, home, detail,
                     history, settings, feedback, paywall, privacy.
                     detail / history / settings all have headerShown: false
                     (TabBar handles nav).

  index.tsx          Entry: checks AsyncStorage for profile → /detail or onboarding.

  onboarding.tsx     3-step profile setup. On complete → router.replace('/detail').

  home.tsx           LOADING SCREEN ONLY. Shows star-particle animation while
                     generating the first reading, then router.replace('/detail').
                     Do NOT put content here. It is intentionally a redirect loader.

  detail.tsx         PRIMARY SCREEN. Full daily reading. Uses <Screen showTabBar>.

  history.tsx        Calendar/list of past readings. Uses <Screen showTabBar>.

  settings.tsx       Profile editing + photo management. Uses <Screen showTabBar>.

  feedback.tsx       Post-day rating: Yes / Somewhat / No + tag chips.

  paywall.tsx        RevenueCat paywall. Triggered by PremiumGate component.

  privacy.tsx        Privacy policy screen.

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

### `app/onboarding.tsx` (changed in earlier session)
- Post-save now routes to `router.replace('/detail')` (was `/home`)
- Added step 3 photo trust copy before `ProfilePhotoCapture`: face = "energy field and presence," palm = "life line patterns," handwriting = "intention energy"
- Privacy Policy link is visible in the onboarding intro card before the app collects birthday, optional birth details, or optional photos. It routes to the in-app `/privacy` screen, which links to the hosted policy at `https://luckyday-privacy.tiiny.site`.

### `app/settings.tsx`
- Privacy controls now include a visible "Read Privacy Policy" link to `/privacy`.
- Profile, photo, feedback, and local data controls all remain on-device management actions.

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
- **Why:** App Store review device (iPad Air M3, iPadOS 26.4.2) crashes at launch due to an NSException thrown inside a void TurboModule method during app initialization. With New Architecture enabled, NSExceptions that escape TurboModule void methods propagate through the C++ boundary to `abort()` — JS `try/catch` cannot intercept them. With Old Architecture (bridge mode), exceptions from native modules become JavaScript errors instead of terminating the app.
- **Which module is crashing:** The crash happens ~72ms after launch on `com.meta.react.turbomodulemanager.queue`. All native modules are compiled into `React.framework`, so the exact module cannot be identified from the crash log without native symbols. Most likely candidate: `SplashScreen.preventAutoHideAsync()` (called at module-load time in `_layout.tsx` before any component mounts) using a UIKit API that changed in iOS 26. `react-native-purchases` is NOT installed, so it is not the cause.
- **Why not a code-level fix:** Native Obj-C NSExceptions cannot be caught by JS try/catch in the New Architecture. The only JS-level fix would be "don't call the method that throws," but without symbols we can't pinpoint the method. Disabling New Architecture is the correct unblock.
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

---

## 5. Known Issues / Remaining Gaps

### Pool content ceiling (~20 days)
After ~20 days, zodiac insight repeats will start. After ~60 days, some mainMessage repeats. The practical "feels fresh" window is 3–4 weeks with the current deterministic pool approach. The long-term fix is AI-generated per-reading content (requires a backend + API call + local caching). Do not block launch on this.

### Birth time and birthplace: collected, not used
`profile.birthTime` and `profile.birthplace` are stored but unused in reading calculation. They were collected for future features. Do not remove them from the data model or the onboarding UI. Do not tell users they affect the reading until they actually do.

### RevenueCat production configuration needs final dashboard verification
`src/lib/purchases.ts` has a configured iOS public key and the visible paywall no longer shows fallback/test-only pricing. Before any EAS production build, verify in RevenueCat that this key belongs to the production app, the current offering is live, annual/monthly packages are mapped to App Store Connect products, and the `premium` entitlement unlocks correctly.

### Evening reflection reminder not yet implemented
Push notifications are already available for the morning reminder, but a separate 8 PM "How was your luck today?" reflection reminder should be added deliberately with its own storage key, cancellation behavior, settings copy, and opt-in/permission handling.

---

## 6. Recommended Next Steps (Priority Order)

**1. EAS build with crash fix (do this first)**
- `app.json` already has `"newArchEnabled": false`
- `eas build --platform ios --profile production`
- Upload IPA to App Store Connect
- Respond to rejection: "We identified a compatibility issue with the New Architecture and iOS 26. We've disabled the New Architecture (using the stable bridge mode) and submitted an updated build."
- If Apple asks for a specific fix description, reference: `NSException thrown in void TurboModule invocation on iOS 26 with RN 0.81 + New Architecture enabled`

**2. RevenueCat production key verification**
- Verify the configured key in `src/lib/purchases.ts` against RevenueCat dashboard
- Confirm current offering, packages, and `premium` entitlement are live
- Verify bundle ID `com.santipap.luckyday` matches exactly in RevenueCat

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
