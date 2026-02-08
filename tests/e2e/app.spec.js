const { test, expect } = require('@playwright/test');

test('スレ作成 -> 返信 -> bump -> 検索フロー', async ({ page }) => {
  const unique = Date.now();
  const title = `E2E Thread ${unique}`;
  const body = `E2E body ${unique}`;
  const replyBody = `E2E reply ${unique}`;

  await page.goto('/new');

  await page.getByLabel('タイトル').fill(title);
  await page.getByLabel('本文').fill(body);
  await page.getByLabel('表示名（任意）').fill('E2EUser');
  await page.getByRole('button', { name: 'スレッドを作成する' }).click();

  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('本文').fill(replyBody);
  await page.getByLabel('表示名（任意）').fill('E2EReplier');
  await page.getByRole('button', { name: '返信を送る' }).click();

  await expect(page.getByText(replyBody)).toBeVisible();

  await page.goto('/');
  await page.getByLabel('キーワード').fill(title);
  await page.getByRole('button', { name: '検索' }).click();

  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
});
