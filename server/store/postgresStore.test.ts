/* @vitest-environment node */

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl
  process.env.TOKEN_ENCRYPTION_KEY ??= 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
}

import { randomUUID } from 'node:crypto'

import { describe, expect, test } from 'vitest'

import { createPostgresStore } from './postgresStore.js'
import type { StoredTokens } from './types.js'

const describePostgres = testDatabaseUrl ? describe : describe.skip

function buildTokens(): StoredTokens {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    scope: ['bookmark.read', 'tweet.read'],
  }
}

describePostgres('PostgresStore', () => {
  test('persists sessions, bookmarks, and shared rate-limit state', async () => {
    const store = await createPostgresStore()
    const suffix = randomUUID()
    const account = {
      xUserId: `user-${suffix}`,
      username: `tester_${suffix.slice(0, 8)}`,
      name: 'Test User',
      profileImageUrl: null,
    }

    try {
      const sessionId = await store.createSession(account, buildTokens())
      const session = await store.getSession(sessionId)
      expect(session?.account.xUserId).toBe(account.xUserId)

      await store.replaceBookmarks(account.xUserId, [
        {
          id: `bookmark-${suffix}`,
          text: 'Launch planning for a new bookmark flow',
          author: 'Test User',
          handle: account.username,
          url: `https://x.com/${account.username}/status/${suffix}`,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])

      const bookmarks = await store.getBookmarks(account.xUserId)
      expect(bookmarks.items).toHaveLength(1)
      expect(bookmarks.lastSyncedAt).not.toBeNull()

      const first = await store.checkRateLimit(`bookmark-sync:${account.xUserId}`, 2, 60_000)
      const second = await store.checkRateLimit(`bookmark-sync:${account.xUserId}`, 2, 60_000)
      const third = await store.checkRateLimit(`bookmark-sync:${account.xUserId}`, 2, 60_000)

      expect(first.allowed).toBe(true)
      expect(second.allowed).toBe(true)
      expect(third.allowed).toBe(false)
    } finally {
      await store.close()
    }
  })
})
