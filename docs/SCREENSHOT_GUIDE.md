# LuckyDay App Store Screenshot Guide

Last updated: 2026-04-29

Apple requires 5–10 screenshots per device size. This guide covers the 5-screenshot plan from APP_STORE_LAUNCH_BRIEF.md with exact setup steps so every capture is repeatable.

---

## Setup Before You Start

**Device:** Use a real iPhone. The iPhone 15 Pro or iPhone 14 Pro gives the best resolution for App Store previews. iPhone SE is good for small-screen verification but not primary screenshots.

**Profile to use:**

```
Nickname: Mali
Birthday: 1997-11-19 (Ox — steady, patient energy)
Main focus: Love, Money
Morning reminder: 07:00
```

Why this birthday: 1997 = Ox year. Ox tone is "Steady, patient, deeply grounded" — reads well in a screenshot. Also gives a good Chinese zodiac card visual.

**Score target:** Aim for 74–88. If the score is below 74 or above 90, try a different date for the profile birthday until you get a score you like. The score is deterministic per birthday+date, so you can adjust by testing a few birthday variations.

**Lucky color:** Avoid black or white for the first screenshot pass. If you land on black or white, try birthday `1997-05-03` (Ox, usually produces gold or red tones).

**Environment:**
- Turn off Do Not Disturb status icons that look distracting.
- Set phone to full battery or hide the battery %.
- Use a clean SIM (no carrier name cluttering the status bar) or hide the carrier.
- Time in status bar: 9:41 AM (the classic Apple demo time) — set via Settings > Accessibility > Clock if needed, or just crop the status bar.

---

## Screenshot 1 — Daily Luck Reveal (CONVERSION SCREENSHOT)

**Purpose:** This is the screenshot that sells the app. It must communicate the full product at a glance.

**Screen:** Home

**Overlay copy to add in post:**
> Reveal today's luck energy

**What must be visible:**
- Luck energy orb with score
- Lucky number, lucky color, lucky time, lucky direction (the 2×2 grid)
- Chinese zodiac animal card

**Capture steps:**
1. Open the app on Home.
2. Scroll to show: orb → 2×2 grid → zodiac card.
3. Make sure no keyboard or permission dialog is visible.
4. Take screenshot.

**Post-processing:**
- Add the overlay copy as white text, centered, near the top above the orb.
- Use a soft mauve gradient strip behind the text for legibility.
- Frame in an iPhone mockup if using Sketch/Figma.

---

## Screenshot 2 — Lucky Color And Daily Ritual

**Purpose:** Show the app is more specific than a generic horoscope.

**Screen:** Home (scrolled slightly)

**Overlay copy to add in post:**
> Your color, moon, and timing

**What must be visible:**
- Lucky color card with color swatch and name
- Moon energy card
- Chinese zodiac animal and tone copy
- Small action card

**Capture steps:**
1. Scroll Home so the zodiac card, moon card, and action card are all visible.
2. Take screenshot.

---

## Screenshot 3 — Shareable Story Card

**Purpose:** Show the social growth loop — users share this card.

**Screen:** The 9:16 share card image saved to Photos

**Overlay copy to add in post:**
> Save and share your daily card

**What must be visible:**
- Full 9:16 share card
- Orb with score
- Daily message
- Chinese zodiac animal
- Lucky color swatch and name
- Lucky number
- LuckyDay wordmark

**Capture steps:**
1. On Home, tap "Share today's luck".
2. Allow photo access.
3. The card saves to Photos.
4. Open Photos, find the saved card.
5. Screenshot the card full-screen.

**Note:** The share card is 360×640px rendered at native scale. On a modern iPhone it will be sharp. Do not screenshot the share card while it is in the hidden ViewShot area — capture the saved Photos version only.

---

## Screenshot 4 — Personal Setup (Onboarding)

**Purpose:** Show setup is simple and private.

**Screen:** Onboarding Step 1 or Step 2

**Overlay copy to add in post:**
> Personal guidance in 3 steps

**What must be visible:**
- Step progress indicator (Step 1 of 3)
- Gold progress bar fill
- Nickname field (pre-filled with "Mali")
- Birthday picker with year/month/day filled
- The mauve header card with "Tell LuckyDay about you ✨"

**Capture steps:**
1. Clear the app's local data (Settings > Delete all local data) or use a fresh install.
2. Tap "Create my lucky profile" from the landing page.
3. You are on Step 1 of 3.
4. Type "Mali" in the nickname field.
5. Scroll and tap birthday: 1997 / Nov / 19.
6. Scroll so the progress bar and birthday fields are visible.
7. Take screenshot before tapping Continue.

**Do not capture:**
- Permission dialogs
- An alert from invalid birthday
- The photo step (Step 3) for this screenshot

---

## Screenshot 5 — Reading History And Streak

**Purpose:** Show the habit loop — streak and monthly ritual tracking.

**Screen:** History (accessed via Reading history nav tile on Home)

**Overlay copy to add in post:**
> Build your morning ritual

**What must be visible:**
- Streak pill showing a multi-day streak (ideally 5+ days)
- Month activity grid with several gold dots
- 2–3 recent history cards with score, lucky color, zodiac, moon

**Capture steps:**

To fake a multi-day streak for the screenshot:

1. In your browser, go to `http://localhost:8082` (with Expo web running).
2. Open DevTools > Application > Local Storage.
3. Find the key `luckyday.readingHistory.v1`.
4. Replace the value with the JSON below (or similar). This gives you a 5-day streak ending today.

**Sample history JSON (edit dates to match today and the 4 days before):**

```json
[
  {
    "id": "2026-04-29",
    "date": "2026-04-29",
    "score": 82,
    "mainMessage": "Steady energy favors quiet action today.",
    "luckyColor": "Gold",
    "luckyNumber": 8,
    "luckyTime": "10:00–12:00",
    "luckyDirection": "South",
    "moonPhase": "Waxing Gibbous",
    "moonMessage": "Growing energy supports new intentions.",
    "goodFor": ["Focus", "Planning"],
    "avoid": ["Arguments"],
    "action": "Write down one thing you are grateful for.",
    "chineseZodiac": "Ox"
  },
  {
    "id": "2026-04-28",
    "date": "2026-04-28",
    "score": 76,
    "mainMessage": "Gentle momentum builds when you stay patient.",
    "luckyColor": "Rose",
    "luckyNumber": 3,
    "luckyTime": "08:00–10:00",
    "luckyDirection": "East",
    "moonPhase": "First Quarter",
    "moonMessage": "Take the first step, even a small one.",
    "goodFor": ["Creativity", "Conversation"],
    "avoid": ["Rushing"],
    "action": "Light a candle and breathe for one minute.",
    "chineseZodiac": "Ox"
  },
  {
    "id": "2026-04-27",
    "date": "2026-04-27",
    "score": 79,
    "mainMessage": "Clear thinking arrives early today.",
    "luckyColor": "Jade",
    "luckyNumber": 6,
    "luckyTime": "07:00–09:00",
    "luckyDirection": "North",
    "moonPhase": "Waxing Crescent",
    "moonMessage": "Plant seeds of intention now.",
    "goodFor": ["Decisions", "Learning"],
    "avoid": ["Indecision"],
    "action": "Choose one small task and finish it completely.",
    "chineseZodiac": "Ox"
  },
  {
    "id": "2026-04-26",
    "date": "2026-04-26",
    "score": 85,
    "mainMessage": "Strong luck energy flows in the morning hours.",
    "luckyColor": "Crimson",
    "luckyNumber": 9,
    "luckyTime": "09:00–11:00",
    "luckyDirection": "Southeast",
    "moonPhase": "New Moon",
    "moonMessage": "A fresh cycle begins — set your intention.",
    "goodFor": ["New beginnings", "Health"],
    "avoid": ["Overthinking"],
    "action": "Drink a full glass of water before checking your phone.",
    "chineseZodiac": "Ox"
  },
  {
    "id": "2026-04-25",
    "date": "2026-04-25",
    "score": 74,
    "mainMessage": "Quiet energy rewards patience and presence.",
    "luckyColor": "Lavender",
    "luckyNumber": 4,
    "luckyTime": "14:00–16:00",
    "luckyDirection": "West",
    "moonPhase": "Waning Crescent",
    "moonMessage": "Release what no longer serves you.",
    "goodFor": ["Rest", "Reflection"],
    "avoid": ["Big decisions"],
    "action": "Spend five minutes outside before noon.",
    "chineseZodiac": "Ox"
  }
]
```

5. Reload the app.
6. Navigate to Reading History from Home (tap the "Reading history" nav tile).
7. The streak pill should show "5 days ✨" and the grid should have 5 gold dots.
8. Scroll to show: header + streak pill → month grid → 2 history cards.
9. Take screenshot.

---

## Post-Screenshot Checklist

- [ ] All 5 screenshots captured.
- [ ] No system permission dialogs visible in any screenshot.
- [ ] No black or white lucky color in Screenshot 1.
- [ ] Score is between 74–88 in all screenshots that show the orb.
- [ ] No developer copy visible (no "MVP", no file paths, no localhost URLs).
- [ ] Overlay copy added to each screenshot (5–7 words, white text on soft dark strip or mauve gradient).
- [ ] All text is readable at App Store thumbnail size — zoom out to 20% to verify.
- [ ] All screenshots are 9:16 or close to it for the App Store submission form.
- [ ] Screenshots exported at 3× resolution (native iPhone resolution).

---

## App Store Upload Order

Upload in this order in App Store Connect:

1. Daily Luck Reveal
2. Lucky Color And Daily Ritual
3. Shareable Story Card
4. Personal Setup
5. Reading History And Streak
