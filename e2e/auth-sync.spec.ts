import { expect, test } from '@playwright/test'

const mockXAdminOrigin = `http://127.0.0.1:${process.env.E2E_MOCK_X_PORT ?? '9191'}`

test.beforeEach(async () => {
  await fetch(`${mockXAdminOrigin}/__admin/reset`, {
    method: 'POST',
  })
})

test('connects through OAuth, syncs bookmarks, survives reload, and signs out', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Connect X to load your live bookmarks.')).toBeVisible()
  await page.locator('button', { hasText: /^Connect X$/ }).click()

  await expect(page.locator('button', { hasText: /^Connected @playwright_user$/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Sync now' })).toBeVisible()

  await page.getByRole('button', { name: 'Sync now' }).click()

  await expect(page.getByText('3 visible')).toBeVisible()
  await expect(page.getByText(/Shipping a new AI workflow/).first()).toBeVisible()
  await expect(page.getByText(/Market multiple compression/)).toBeVisible()

  await page.reload()

  await expect(page.locator('button', { hasText: /^Connected @playwright_user$/ })).toBeDisabled()
  await expect(page.getByText('3 visible')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page.locator('button', { hasText: /^Connect X$/ })).toBeVisible()
  await expect(page.getByText('Signed out of X.')).toBeVisible()
})
