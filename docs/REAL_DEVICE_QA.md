# LuckyDay Real Device QA

Last updated: 2026-04-30 (updated for scroll birthday picker and Lunar New Year zodiac logic)

Run this checklist before App Store submission or screenshots.

## Test Devices

Minimum:

- iPhone with Expo Go
- Android phone with Expo Go

Preferred:

- Small iPhone screen
- Large iPhone screen
- Mid-range Android

## Build And Launch

- [ ] App opens from Expo Go.
- [ ] Landing page renders with blush/mauve/champagne palette.
- [ ] Luck energy orb is sharp.
- [ ] Metric cards do not clip text.
- [ ] No black/blank screen on first launch.

## Onboarding

- [ ] Step 1 shows nickname, scroll birthday picker, optional birth time, optional birthplace.
- [ ] Birthday picker: year, month, and day columns scroll smoothly.
- [ ] Birthday picker: tapping a year/month/day highlights the selected value.
- [ ] Birthday picker: February day options update correctly for leap years.
- [ ] Birthday picker: leaving the birthday incomplete shows the "Fill in a valid year, month, and day" alert on Continue.
- [ ] Step 2 shows focus chips and morning reminder (segmented HH / MM with 24-hr badge).
- [ ] Time picker: skipping both HH and MM fields allows Continue (empty = no reminder).
- [ ] Time picker: entering an invalid time (e.g. hour 25) shows the reminder alert on Continue.
- [ ] Step 3 makes photos clearly optional.
- [ ] User can finish onboarding without photos.
- [ ] User can finish onboarding with photos after consent.
- [ ] Back/Continue controls work on every step.
- [ ] Small screens do not hide the primary button.

## Camera And Photos

- [ ] Face capture opens front camera.
- [ ] Left palm opens back camera.
- [ ] Right palm opens back camera.
- [ ] Handwriting opens back camera.
- [ ] Camera permission denial shows a friendly message.
- [ ] Captured previews appear.
- [ ] Retake works.
- [ ] Remove works from Settings.
- [ ] Photo status changes from Optional to Captured.
- [ ] Updated date displays.
- [ ] Photos persist after app restart.

## Daily Reading

- [ ] Home loads after onboarding.
- [ ] Luck energy orb is visible and sharp.
- [ ] 2×2 metric grid (lucky number, color, time, direction) appears directly below the orb — no excessive scrolling to reach it.
- [ ] Lucky color swatch is legible.
- [ ] Lucky number display is prominent.
- [ ] Lucky time and direction fit on small screens.
- [ ] Chinese zodiac animal card appears below the metric grid.
- [ ] Chinese zodiac is correct for early-year birthdays around Lunar New Year boundaries.
- [ ] Moon energy appears.
- [ ] Small action appears.
- [ ] First-visit streak card reads "Start your ritual today ✨" (not "0 days").
- [ ] After first reading saved: streak card reads "1 day ✨".
- [ ] Nav row at bottom shows three card tiles: Daily detail / Reading history / Rate today.
- [ ] All three nav tiles tap through to correct screens.
- [ ] Daily Detail opens and shows all reading sections.

## Share Card

- [ ] `Share today's luck` is visible without excessive scrolling.
- [ ] Photo permission request appears when saving the first time.
- [ ] Denying permission shows friendly copy.
- [ ] Granting permission saves the 9:16 image to Photos.
- [ ] Image is sharp at phone resolution.
- [ ] Image has no clipped text.
- [ ] Long daily messages wrap correctly.
- [ ] Share sheet opens after save.
- [ ] Image can be shared to Instagram.
- [ ] Image can be shared to LINE.
- [ ] Image can be shared to WhatsApp or Messages.
- [ ] Share card does not include nickname, birthday, birth time, or photos.

## Notifications

- [ ] Entering reminder time requests notification permission.
- [ ] Denying permission shows friendly copy.
- [ ] Accepting permission schedules a daily reminder.
- [ ] Changing reminder time cancels the previous reminder.
- [ ] Clearing reminder time disables the reminder.
- [ ] Reset profile cancels the reminder.
- [ ] Delete all local data cancels the reminder.
- [ ] Notification title/body feel appealing.
- [ ] Notification arrives at the expected local time.

## History And Streak

- [ ] Home saves today's reading into History.
- [ ] Reading History opens from Home.
- [ ] Streak shows `1 day` after first saved reading.
- [ ] Month activity grid marks today.
- [ ] Reading history cards show score, message, color, moon, and action.
- [ ] Delete all local data clears history.

## Settings And Privacy

- [ ] Settings loads profile details.
- [ ] Birthday picker pre-fills from saved profile (saved year/month/day are highlighted).
- [ ] Morning reminder picker pre-fills from saved profile (HH / MM segments are populated).
- [ ] Editing birthday and saving settings persists the updated birthday.
- [ ] Saving settings preserves profile id and created date.
- [ ] Clear feedback works.
- [ ] Delete photos only keeps profile and feedback.
- [ ] Delete all local data returns to welcome.
- [ ] Privacy copy does not use developer terms like MVP.
- [ ] Local storage not encrypted warning is visible.

## App Store Screenshot Pass

- [ ] Capture Daily Luck Reveal screenshot.
- [ ] Capture Lucky Color / Zodiac / Moon screenshot.
- [ ] Capture Share Card screenshot.
- [ ] Capture Onboarding screenshot.
- [ ] Capture History / Streak screenshot.
- [ ] Review every screenshot at small App Store thumbnail size.

## Known Non-Launch Work

- Native encrypted photo storage.
- Cloud sync.
- Auth.
- Premium paywall.
- Multiple share-card themes.
- Animated share cards.
