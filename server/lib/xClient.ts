import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'

import { serverConfig } from '../config.js'
import { normalizeBookmark } from './normalizeBookmark.js'

type ViewerResponse = {
  data?: {
    id: string
    name?: string
    username?: string
    profile_image_url?: string
  }
}

type BookmarkResponse = {
  data?: Array<{
    id: string
    text?: string
    author_id?: string
    created_at?: string
  }>
  includes?: {
    users?: Array<{
      id: string
      name?: string
      username?: string
    }>
  }
  meta?: {
    next_token?: string
  }
}

async function fetchXJson<T>(path: string, accessToken: string) {
  const response = await fetch(`${serverConfig.X_API_BASE_URL}${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`X API request failed (${response.status}): ${text.slice(0, 180)}`)
  }

  return (await response.json()) as T
}

export async function fetchViewer(accessToken: string): Promise<XAccountSummary> {
  const response = await fetchXJson<ViewerResponse>(
    '/users/me?user.fields=name,username,profile_image_url',
    accessToken,
  )
  const user = response.data

  if (!user?.id || !user.name || !user.username) {
    throw new Error('X did not return a usable account identity.')
  }

  return {
    xUserId: user.id,
    username: user.username,
    name: user.name,
    profileImageUrl: user.profile_image_url ?? null,
  }
}

export async function fetchAllBookmarks(accessToken: string, account: XAccountSummary) {
  const bookmarks: BookmarkRecord[] = []
  let paginationToken: string | null = null
  let pageCount = 0

  do {
    const params = new URLSearchParams({
      expansions: 'author_id',
      'tweet.fields': 'author_id,created_at,text',
      'user.fields': 'name,username',
      max_results: '100',
    })

    if (paginationToken) {
      params.set('pagination_token', paginationToken)
    }

    const response = await fetchXJson<BookmarkResponse>(
      `/users/${account.xUserId}/bookmarks?${params.toString()}`,
      accessToken,
    )

    const usersById = new Map((response.includes?.users ?? []).map((user) => [user.id, user]))

    for (const post of response.data ?? []) {
      bookmarks.push(normalizeBookmark(post, usersById, account))
    }

    paginationToken = response.meta?.next_token ?? null
    pageCount += 1
  } while (paginationToken && pageCount < 8)

  return bookmarks
}
