import { expect, test } from '@playwright/test';

const profile = {
  id: 'e2e-profile',
  nickname: 'Mali',
  birthday: '1996-04-13',
  birthTime: '08:30',
  birthplace: 'Bangkok',
  mainFocus: 'Work',
  notificationTime: '08:00',
  westernZodiac: 'Aries',
  chineseZodiac: 'Rat',
  photos: {
    faceUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    leftPalmUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    rightPalmUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    handwritingUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  },
  mediaConsentAt: '2026-04-28T00:00:00.000Z',
  createdAt: '2026-04-28T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
});

test('new users see sample reading and consent-gated photo setup', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LuckyDay', { exact: true })).toBeVisible();
  await expect(page.getByText('Your daily luck guide.')).toBeVisible();

  await page.getByText('Create my profile').click();

  await expect(page.getByText('One-time setup')).toBeVisible();
  await expect(page.getByText('Photo privacy')).toBeVisible();
  await expect(page.getByText('I understand and agree to save these photos on this device.')).toBeVisible();
  await expect(page.getByText('Face', { exact: true })).toBeVisible();
  await expect(page.getByText('Left palm', { exact: true })).toBeVisible();
  await expect(page.getByText('Right palm', { exact: true })).toBeVisible();
  await expect(page.getByText('Handwriting', { exact: true })).toBeVisible();
});

test('saved users can retake all setup photos from settings', async ({ page }) => {
  await page.addInitScript((storedProfile) => {
    window.localStorage.setItem('luckyday.profile.v1', JSON.stringify(storedProfile));
  }, profile);

  await page.goto('/settings');

  await expect(page.getByText('Your profile', { exact: true })).toBeVisible();
  await expect(page.getByText('Luck photos')).toBeVisible();
  await expect(page.getByText('Retake any setup photo when your profile needs a refresh.')).toBeVisible();
  await expect(page.getByText('Retake photo')).toHaveCount(4);
});
