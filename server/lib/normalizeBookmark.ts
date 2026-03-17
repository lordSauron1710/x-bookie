import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'

type XBookmarkPost = {
  id: string
  text?: string
  author_id?: string
  created_at?: string
}

type XBookmarkUser = {
  id: string
  username?: string
  name?: string
}

export function normalizeBookmark(
  post: XBookmarkPost,
  usersById: Map<string, XBookmarkUser>,
  fallbackAccount: XAccountSummary,
): BookmarkRecord {
  const author = post.author_id ? usersById.get(post.author_id) : null
  const handle = author?.username ?? fallbackAccount.username
  const name = author?.name ?? fallbackAccount.name

  return {
    id: post.id,
    text: post.text?.trim() || '(No text provided by X.)',
    author: name,
    handle,
    url: `https://x.com/${handle}/status/${post.id}`,
    createdAt: post.created_at ?? null,
  }
}
