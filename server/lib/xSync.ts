import type { AppStore, StoredSession } from '../store/types.js'
import { fetchAllBookmarks } from './xClient.js'
import { refreshTokens } from './xOAuth.js'

function shouldRefreshToken(session: StoredSession) {
  if (!session.tokens.accessTokenExpiresAt) return false
  const expiresAt = new Date(session.tokens.accessTokenExpiresAt).getTime()
  return expiresAt - Date.now() < 30_000
}

export async function ensureAccessToken(session: StoredSession, store: AppStore) {
  if (!shouldRefreshToken(session)) {
    return session.tokens.accessToken
  }

  if (!session.tokens.refreshToken) {
    return session.tokens.accessToken
  }

  const nextTokens = await refreshTokens(session.tokens.refreshToken)
  await store.updateSessionTokens(session.id, nextTokens)
  return nextTokens.accessToken
}

export async function syncBookmarksForSession(session: StoredSession, store: AppStore) {
  const accessToken = await ensureAccessToken(session, store)
  const bookmarks = await fetchAllBookmarks(accessToken, session.account)
  return store.replaceBookmarks(session.account.xUserId, bookmarks)
}
