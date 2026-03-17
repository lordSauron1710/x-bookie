import { expect, test } from '@playwright/test'

const hasPostgres = Boolean(process.env.E2E_DATABASE_URL)

test.skip(!hasPostgres, 'E2E_DATABASE_URL is required for the Postgres persistence flow.')

test('uses the Postgres store and keeps session state across reloads', async ({ page, request }) => {
  const health = await request.get('/api/health')
  await expect(health.ok()).toBeTruthy()
  await expect(health.json()).resolves.toEqual({ ok: true, store: 'postgres' })

  await page.goto('/')
  await page.locator('button', { hasText: /^Connect X$/ }).click()
  await expect(page.locator('button', { hasText: /^Connected @playwright_user$/ })).toBeDisabled()

  await page.getByRole('button', { name: 'Sync now' }).click()
  await expect(page.getByText('3 visible')).toBeVisible()

  await page.reload()

  await expect(page.locator('button', { hasText: /^Connected @playwright_user$/ })).toBeDisabled()
  await expect(page.getByText('3 visible')).toBeVisible()
})
