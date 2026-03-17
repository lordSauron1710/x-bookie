/* @vitest-environment node */

import { describe, expect, test, vi } from 'vitest'

import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'
import { MemoryStore } from './memoryStore.js'
import type { StoredTokens } from './types.js'

const baseAccount: XAccountSummary = {
  xUserId: 'user-1',
  username: 'tester',
  name: 'Test User',
  profileImageUrl: null,
}

const baseTokens: StoredTokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  accessTokenExpiresAt: '2030-01-01T00:00:00.000Z',
  scope: ['bookmark.read'],
}

const bookmark: BookmarkRecord = {
  id: 'tweet-1',
  text: 'hello',
  author: 'Test User',
  handle: 'tester',
  url: 'https://x.com/tester/status/tweet-1',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('MemoryStore', () => {
  test('creates auth transactions and consumes them once', async () => {
    const store = new MemoryStore()
    const state = await store.createAuthTransaction('pkce-verifier')

    const first = await store.consumeAuthTransaction(state)
    const second = await store.consumeAuthTransaction(state)

    expect(first?.verifier).toBe('pkce-verifier')
    expect(second).toBeNull()
  })

  test('expires auth transactions after ttl', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const store = new MemoryStore()
    const state = await store.createAuthTransaction('pkce-verifier')
    vi.advanceTimersByTime(10 * 60 * 1000 + 1)

    await expect(store.consumeAuthTransaction(state)).resolves.toBeNull()
    vi.useRealTimers()
  })

  test('creates sessions and refreshes lastSeenAt when fetched', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const store = new MemoryStore()
    const sessionId = await store.createSession(baseAccount, baseTokens)
    const created = await store.getSession(sessionId)
    expect(created).not.toBeNull()
    expect(created?.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(created?.lastSeenAt).toBe('2026-01-01T00:00:00.000Z')

    vi.advanceTimersByTime(5_000)
    const seen = await store.getSession(sessionId)
    expect(seen?.lastSeenAt).toBe('2026-01-01T00:00:05.000Z')
    vi.useRealTimers()
  })

  test('updates tokens and returns null for unknown sessions', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const store = new MemoryStore()
    const sessionId = await store.createSession(baseAccount, baseTokens)
    const missing = await store.updateSessionTokens('missing', baseTokens)
    expect(missing).toBeNull()

    vi.advanceTimersByTime(30_000)
    const updatedTokens: StoredTokens = {
      ...baseTokens,
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    }

    const updated = await store.updateSessionTokens(sessionId, updatedTokens)
    expect(updated?.tokens.accessToken).toBe('access-2')
    expect(updated?.tokens.refreshToken).toBe('refresh-2')
    expect(updated?.lastSeenAt).toBe('2026-01-01T00:00:30.000Z')
    vi.useRealTimers()
  })

  test('returns empty bookmark feeds by default and replaces feeds', async () => {
    const store = new MemoryStore()

    await expect(store.getBookmarks('unknown')).resolves.toEqual({
      items: [],
      lastSyncedAt: null,
    })

    const replaced = await store.replaceBookmarks(baseAccount.xUserId, [bookmark])
    expect(replaced.items).toHaveLength(1)
    expect(replaced.lastSyncedAt).not.toBeNull()

    const readBack = await store.getBookmarks(baseAccount.xUserId)
    expect(readBack.items[0].id).toBe('tweet-1')
  })

  test('clears all in-memory data on close', async () => {
    const store = new MemoryStore()
    const state = await store.createAuthTransaction('pkce-verifier')
    const sessionId = await store.createSession(baseAccount, baseTokens)
    await store.replaceBookmarks(baseAccount.xUserId, [bookmark])

    await store.close()

    await expect(store.consumeAuthTransaction(state)).resolves.toBeNull()
    await expect(store.getSession(sessionId)).resolves.toBeNull()
    await expect(store.getBookmarks(baseAccount.xUserId)).resolves.toEqual({
      items: [],
      lastSyncedAt: null,
    })
  })

  test('tracks rate limits per key', async () => {
    const store = new MemoryStore()

    const first = await store.checkRateLimit('sync:user-1', 2, 60_000)
    const second = await store.checkRateLimit('sync:user-1', 2, 60_000)
    const third = await store.checkRateLimit('sync:user-1', 2, 60_000)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })
})
