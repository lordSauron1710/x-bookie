/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { XAccountSummary } from '../../shared/contracts.js'
import { fetchAllBookmarks, fetchViewer } from './xClient.js'

const account: XAccountSummary = {
  xUserId: '12345',
  username: 'fallback-handle',
  name: 'Fallback Name',
  profileImageUrl: null,
}

describe('xClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('fetchViewer returns normalized account data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: '42',
          name: 'Ada Lovelace',
          username: 'ada',
          profile_image_url: 'https://img.example/avatar.png',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const viewer = await fetchViewer('access-token')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.x.com/2/users/me?user.fields=name,username,profile_image_url',
      {
        headers: {
          authorization: 'Bearer access-token',
        },
      },
    )
    expect(viewer).toEqual({
      xUserId: '42',
      username: 'ada',
      name: 'Ada Lovelace',
      profileImageUrl: 'https://img.example/avatar.png',
    })
  })

  test('fetchViewer rejects incomplete user payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '42' },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchViewer('access-token')).rejects.toThrow('X did not return a usable account identity.')
  })

  test('fetchAllBookmarks fetches a single page with author expansion data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'tweet-1',
            text: '  hello from x  ',
            author_id: 'user-a',
            created_at: '2026-02-01T00:00:00.000Z',
          },
        ],
        includes: {
          users: [
            {
              id: 'user-a',
              name: 'Author A',
              username: 'author_a',
            },
          ],
        },
        meta: {},
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchAllBookmarks('access-token', account)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/users/12345/bookmarks?')
    expect(String(url)).toContain('expansions=author_id')
    expect(items).toEqual([
      {
        id: 'tweet-1',
        text: 'hello from x',
        author: 'Author A',
        handle: 'author_a',
        url: 'https://x.com/author_a/status/tweet-1',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ])
  })

  test('fetchAllBookmarks paginates until next_token is exhausted', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'tweet-1', text: 'one' }],
          includes: { users: [] },
          meta: { next_token: 'next-1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'tweet-2', text: 'two' }],
          includes: { users: [] },
          meta: {},
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchAllBookmarks('access-token', account)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(items.map((item) => item.id)).toEqual(['tweet-1', 'tweet-2'])
  })

  test('fetchAllBookmarks stops after 8 pages to bound upstream usage', async () => {
    let page = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      page += 1
      return {
        ok: true,
        json: async () => ({
          data: [{ id: `tweet-${page}`, text: `post ${page}` }],
          includes: { users: [] },
          meta: { next_token: `next-${page}` },
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchAllBookmarks('access-token', account)

    expect(fetchMock).toHaveBeenCalledTimes(8)
    expect(items).toHaveLength(8)
    expect(items.at(-1)?.id).toBe('tweet-8')
  })

  test('falls back to account identity when author expansion is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'tweet-1', text: 'no author in includes', author_id: 'unknown' }],
        includes: { users: [] },
        meta: {},
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchAllBookmarks('access-token', account)
    expect(items[0].author).toBe('Fallback Name')
    expect(items[0].handle).toBe('fallback-handle')
    expect(items[0].url).toBe('https://x.com/fallback-handle/status/tweet-1')
  })

  test('propagates upstream API errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'x failure',
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchViewer('access-token')).rejects.toThrow('X API request failed (500): x failure')
  })
})
