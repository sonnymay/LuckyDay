import { expect, test } from '@playwright/test';

const profile = {
  id: 'e2e-profile',
  nickname: 'Mali',
  birthday: '1996-04-13',
  birthTime: '08:30',
  birthplace: 'Bangkok',
  mainFocus: ['Work'],
  notificationTime: '08:00',
  westernZodiac: 'Aries',
  chineseZodiac: 'Rat',
  photos: {
    faceUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    leftPalmUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    rightPalmUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    handwritingUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  },
  photoTimestamps: {
    faceUpdatedAt: '2026-04-28T00:00:00.000Z',
    leftPalmUpdatedAt: '2026-04-28T00:00:00.000Z',
    rightPalmUpdatedAt: '2026-04-28T00:00:00.000Z',
    handwritingUpdatedAt: '2026-04-28T00:00:00.000Z',
  },
  mediaConsentAt: '2026-04-28T00:00:00.000Z',
  createdAt: '2026-04-28T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
});

test('new users see daily preview and optional photo setup', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LuckyDay', { exact: true })).toBeVisible();
  await expect(page.getByText('Your daily ritual for luck, timing, and intention')).toBeVisible();
  await expect(page.getByText("Today's preview")).toBeVisible();
  await expect(page.getByText('Lucky color')).toBeVisible();
  await expect(page.getByText('Chinese zodiac')).toBeVisible();
  await expect(page.getByText('Clever, quick, full of charm')).toBeVisible();
  await expect(page.getByText('Thai day color')).toHaveCount(0);

  await page.getByText('Create my lucky profile').click();

  await expect(page.getByText('Step 1 of 3')).toBeVisible();
  await expect(page.getByText('Tell LuckyDay about you')).toBeVisible();
  await page.getByPlaceholder('Mali').fill('Nok');
  await page.getByText('2013', { exact: true }).click();
  await page.getByText('Jan', { exact: true }).click();
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Continue').click();

  await expect(page.getByText('Step 2 of 3')).toBeVisible();
  await expect(page.getByText('Main focuses')).toBeVisible();
  await expect(page.getByText('Choose one, a few, or all of them.')).toBeVisible();
  await page.getByText('Continue').click();

  await expect(page.getByText('Step 3 of 3')).toBeVisible();
  await expect(page.getByText('Optional luck photos 🍀', { exact: true })).toBeVisible();
  await expect(page.getByText('You can skip these now and add them later in Settings.')).toBeVisible();
  await expect(page.getByText('Photo privacy')).toBeVisible();
  await expect(page.getByText('I agree to save optional photos on this device.')).toBeVisible();
  await expect(page.getByText('Face', { exact: true })).toBeVisible();
  await expect(page.getByText('Left palm', { exact: true })).toBeVisible();
  await expect(page.getByText('Right palm', { exact: true })).toBeVisible();
  await expect(page.getByText('Handwriting', { exact: true })).toBeVisible();
  await expect(page.getByText('Optional', { exact: true })).toHaveCount(4);
});

test('new users can finish onboarding without photos', async ({ page }) => {
  await page.goto('/');

  await page.getByText('Create my lucky profile').click();
  await page.getByPlaceholder('Mali').fill('Nok');
  await page.getByText('2013', { exact: true }).click();
  await page.getByText('Jan', { exact: true }).click();
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Continue').click();
  await page.getByText('Continue').click();
  await page.getByText("Show today's luck").click();

  await expect(page.getByText('Hi, Nok')).toBeVisible();
  await expect(page.getByText("Today's luck energy")).toBeVisible();
  await expect(page.getByText('Daily ritual streak')).toBeVisible();
  await expect(page.getByText('1 day ✨')).toBeVisible();
  await expect(page.getByText('Magnetic, powerful, golden energy')).toBeVisible();
  await expect(page.getByText('Send a little luck')).toBeVisible();
  await expect(page.getByText("Share today's luck")).toBeVisible();
  await expect(page.getByText('Reading history')).toBeVisible();
});

test('saved users can retake all setup photos from settings', async ({ page }) => {
  await page.addInitScript((storedProfile) => {
    window.localStorage.setItem('luckyday.profile.v1', JSON.stringify(storedProfile));
  }, profile);

  await page.goto('/settings');

  await expect(page.getByText('Your profile ✨', { exact: true })).toBeVisible();
  await expect(page.getByText('Optional luck photos')).toBeVisible();
  await expect(page.getByText('Add, retake, or remove photos anytime. Photo links are saved on this device and are not encrypted.')).toBeVisible();
  await expect(page.getByText('Retake photo')).toHaveCount(4);
  await expect(page.getByText('Captured')).toHaveCount(4);
  await expect(page.getByText(/Updated/)).toHaveCount(4);
  await expect(page.getByText('Remove', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Privacy controls')).toBeVisible();
  await expect(page.getByText('Clear feedback')).toBeVisible();
  await expect(page.getByText('Delete photos only')).toBeVisible();
  await expect(page.getByText('Delete all local data')).toBeVisible();
});
