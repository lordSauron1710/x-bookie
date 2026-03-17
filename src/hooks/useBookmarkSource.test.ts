/* @vitest-environment jsdom */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, beforeEach, vi } from 'vitest'

import type { BookmarkRecord, SessionResponse } from '../../shared/contracts.ts'
import { useBookmarkSource } from './useBookmarkSource'

const fetchSessionMock = vi.fn<() => Promise<SessionResponse>>()
const fetchBookmarksMock = vi.fn<() => Promise<{ items: BookmarkRecord[]; total: number; lastSyncedAt: string | null }>>()
const syncBookmarksMock = vi.fn<() => Promise<{ syncedCount: number; totalStored: number; lastSyncedAt: string | null }>>()
const logoutMock = vi.fn<() => Promise<void>>()
const startXLoginMock = vi.fn<() => void>()

vi.mock('../lib/api', () => ({
  fetchSession: () => fetchSessionMock(),
  fetchBookmarks: () => fetchBookmarksMock(),
  syncBookmarks: () => syncBookmarksMock(),
  logout: () => logoutMock(),
  startXLogin: () => startXLoginMock(),
}))

function buildSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    authenticated: false,
    xAuthConfigured: true,
    classificationMode: 'heuristic',
    account: null,
    bookmarkCount: 0,
    lastSyncedAt: null,
    ...overrides,
  }
}

function buildBookmark(id: string, text: string): BookmarkRecord {
  return {
    id,
    text,
    author: 'Tester',
    handle: 'tester',
    url: `https://x.com/tester/status/${id}`,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

describe('useBookmarkSource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  test('bootstraps unauthenticated state with connect message', async () => {
    fetchSessionMock.mockResolvedValue(buildSession())

    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    expect(result.current.bookmarks).toEqual([])
    expect(result.current.statusMessage).toBe('Connect X to load your live bookmarks.')
    expect(fetchBookmarksMock).not.toHaveBeenCalled()
  })

  test('bootstraps authenticated feed and shows ready status', async () => {
    fetchSessionMock.mockResolvedValue(
      buildSession({
        authenticated: true,
        account: { xUserId: 'u1', username: 'alice', name: 'Alice', profileImageUrl: null },
        bookmarkCount: 2,
      }),
    )
    fetchBookmarksMock.mockResolvedValue({
      items: [buildBookmark('1', 'alpha post'), buildBookmark('2', 'beta post')],
      total: 2,
      lastSyncedAt: '2026-01-03T00:00:00Z',
    })

    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    expect(result.current.bookmarks).toHaveLength(2)
    expect(result.current.statusMessage).toContain('Connected as @alice')
    expect(result.current.statusMessage).toContain('2 bookmarks are ready to sort')
  })

  test('consumes auth query message and clears query params', async () => {
    window.history.replaceState({}, '', '/?auth=connected&from=test')
    fetchSessionMock.mockResolvedValue(buildSession())

    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    expect(result.current.statusMessage).toBe('Connected to X. Sync your bookmarks to load the feed.')
    expect(window.location.search).toBe('?from=test')
  })

  test('syncFromX is guarded when signed out', async () => {
    fetchSessionMock.mockResolvedValue(buildSession())
    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    await act(async () => {
      await result.current.syncFromX()
    })

    expect(syncBookmarksMock).not.toHaveBeenCalled()
    expect(result.current.statusMessage).toBe('Connect X before syncing bookmarks.')
  })

  test('syncFromX refreshes session and bookmarks on success', async () => {
    fetchSessionMock
      .mockResolvedValueOnce(
        buildSession({
          authenticated: true,
          account: { xUserId: 'u1', username: 'alice', name: 'Alice', profileImageUrl: null },
          bookmarkCount: 1,
        }),
      )
      .mockResolvedValueOnce(
        buildSession({
          authenticated: true,
          account: { xUserId: 'u1', username: 'alice', name: 'Alice', profileImageUrl: null },
          bookmarkCount: 2,
          lastSyncedAt: '2026-01-05T00:00:00Z',
        }),
      )
    fetchBookmarksMock
      .mockResolvedValueOnce({
        items: [buildBookmark('1', 'existing')],
        total: 1,
        lastSyncedAt: null,
      })
      .mockResolvedValueOnce({
        items: [buildBookmark('1', 'existing'), buildBookmark('2', 'new item')],
        total: 2,
        lastSyncedAt: '2026-01-05T00:00:00Z',
      })
    syncBookmarksMock.mockResolvedValue({
      syncedCount: 2,
      totalStored: 2,
      lastSyncedAt: '2026-01-05T00:00:00Z',
    })

    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    await act(async () => {
      await result.current.syncFromX()
    })

    expect(syncBookmarksMock).toHaveBeenCalledTimes(1)
    expect(result.current.bookmarks).toHaveLength(2)
    expect(result.current.statusMessage).toBe('Synced 2 bookmarks from X.')
    expect(result.current.isSyncing).toBe(false)
  })

  test('signOut resets local state and session', async () => {
    fetchSessionMock.mockResolvedValue(
      buildSession({
        authenticated: true,
        account: { xUserId: 'u1', username: 'alice', name: 'Alice', profileImageUrl: null },
        bookmarkCount: 1,
      }),
    )
    fetchBookmarksMock.mockResolvedValue({
      items: [buildBookmark('1', 'existing')],
      total: 1,
      lastSyncedAt: null,
    })
    logoutMock.mockResolvedValue()

    const { result } = renderHook(() => useBookmarkSource())

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.session?.authenticated).toBe(false)
    expect(result.current.bookmarks).toEqual([])
    expect(result.current.statusMessage).toBe('Signed out of X.')
  })
})
