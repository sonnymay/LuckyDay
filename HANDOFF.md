# LuckyDay — Codex Handoff Document

**Last updated:** 2026-05-05
**Stack:** Expo SDK 54, React Native, expo-router ~6.0.23, TypeScript, RevenueCat IAP
**Target:** iOS App Store (primary). Android and Web secondary.

---

## 1. Current App Status

Feature-complete and working as an offline daily luck reader. **Not yet submitted** to the App Store. Still required before release:

- [ ] Replace RevenueCat placeholder key with real production key (`src/lib/purchases.ts`)
- [ ] EAS build (`eas build --platform ios --profile production`)
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
                     purchasePackage(), getOfferings(). KEY IS PLACEHOLDER.

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
  2. Score context card — 5-band scale bar + plain-English sentence + yesterday delta
  3. Three qualitative influence chips — zodiac/moon/almanac, no raw numbers
  4. Action hero card — dark mauve, "🍀 Do this today" + action text
  5. Date/lunar date/solar term card + main message (alternate display)
  6. Lucky color + lucky number quick cards
  7. Lucky time + direction quick cards
  8. Good for / Avoid almanac pills
  9. Full breakdown card (zodiac insights, moon message, money, love, work, health, warning)
  10. Share button
- Fortune quote card: **removed entirely** (was generic, added no value)
- `scoreReason`: exists in data but is **intentionally not displayed**
- Action was **promoted** from bottom of breakdown to hero card near top

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

### `app/home.tsx` (changed in earlier session)
- Now a pure loading screen → `router.replace('/detail')` after animation
- Do NOT add content here
- Removed visible `scoreReason` rendering from the home UI. `scoreReason` remains in data but is hidden from users.
- Tightened star particle position typing to percentage template strings so `Animated.Text` style typechecks.

### `app/onboarding.tsx` (changed in earlier session)
- Post-save now routes to `router.replace('/detail')` (was `/home`)
- Added step 3 photo trust copy before `ProfilePhotoCapture`: face = "energy field and presence," palm = "life line patterns," handwriting = "intention energy"

### `app/_layout.tsx` (changed in earlier session)
- `detail` screen: `headerShown: false`

### `src/components/TabBar.tsx` (changed in earlier session)
- Today tab path changed from `/home` → `/detail`

### `src/lib/notifications.ts` (changed in earlier session)
- All notification titles and bodies rewritten with curiosity-driven copy
- 10 title variants, 15 body variants

### `app/paywall.tsx` (changed in earlier session)
- `FEATURES` array updated to concrete daily-use benefits (not abstract premium language)

### `package.json` / `package-lock.json`
- Added `@expo/vector-icons` as an explicit Expo dependency so imports in `app/home.tsx`, `app/paywall.tsx`, and `src/components/TabBar.tsx` resolve cleanly in TypeScript.

### Verification (2026-05-05)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes: 2 test files, 16 tests

---

## 5. Known Issues / Remaining Gaps

### Pool content ceiling (~20 days)
After ~20 days, zodiac insight repeats will start. After ~60 days, some mainMessage repeats. The practical "feels fresh" window is 3–4 weeks with the current deterministic pool approach. The long-term fix is AI-generated per-reading content (requires a backend + API call + local caching). Do not block launch on this.

### Birth time and birthplace: collected, not used
`profile.birthTime` and `profile.birthplace` are stored but unused in reading calculation. They were collected for future features. Do not remove them from the data model or the onboarding UI. Do not tell users they affect the reading until they actually do.

### RevenueCat key is a placeholder
`src/lib/purchases.ts` has a hardcoded dev/test key. Must be replaced with real production key from RevenueCat dashboard before any EAS production build.

---

## 6. Recommended Next Steps (Priority Order)

**1. App Store screenshots (est. 2–3 hours)**
Shot list is in `APP_STORE_COPY.md`. Run on simulator at 6.7" (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus). 6 screenshots total. Use a profile with score 85+ for the hero shot ("Peak energy" band should be highlighted). Frame the first screenshot as the full detail screen with a visually strong reading.

**2. RevenueCat production key + EAS build**
- Replace key in `src/lib/purchases.ts`
- `eas build --platform ios --profile production`
- Upload IPA to App Store Connect
- Submit for TestFlight → then App Store review

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
