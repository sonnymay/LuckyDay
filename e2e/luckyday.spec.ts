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

test('new users see sample reading and optional photo setup', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LuckyDay', { exact: true })).toBeVisible();
  await expect(page.getByText('Your daily luck guide.')).toBeVisible();

  await page.getByText('Create my profile').click();

  await expect(page.getByText('One-time setup')).toBeVisible();
  await expect(page.getByText('Main focuses')).toBeVisible();
  await expect(page.getByText('Choose one, a few, or all of them.')).toBeVisible();
  await expect(page.getByText('Optional luck photos')).toBeVisible();
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

  await page.getByText('Create my profile').click();
  await page.getByPlaceholder('Mali').fill('Nok');
  await page.getByPlaceholder('YYYY-MM-DD').fill('1994-08-12');
  await page.getByText("Show today's luck").click();

  await expect(page.getByText('Hi, Nok')).toBeVisible();
  await expect(page.getByText('Today Score')).toBeVisible();
});

test('saved users can retake all setup photos from settings', async ({ page }) => {
  await page.addInitScript((storedProfile) => {
    window.localStorage.setItem('luckyday.profile.v1', JSON.stringify(storedProfile));
  }, profile);

  await page.goto('/settings');

  await expect(page.getByText('Your profile', { exact: true })).toBeVisible();
  await expect(page.getByText('Optional luck photos')).toBeVisible();
  await expect(page.getByText('Add, retake, or remove photos anytime. Photo links are saved locally and are not encrypted in this MVP.')).toBeVisible();
  await expect(page.getByText('Retake photo')).toHaveCount(4);
  await expect(page.getByText('Captured')).toHaveCount(4);
  await expect(page.getByText(/Updated/)).toHaveCount(4);
  await expect(page.getByText('Remove')).toHaveCount(4);
  await expect(page.getByText('Privacy controls')).toBeVisible();
  await expect(page.getByText('Clear feedback')).toBeVisible();
  await expect(page.getByText('Delete photos only')).toBeVisible();
  await expect(page.getByText('Delete all local data')).toBeVisible();
});
