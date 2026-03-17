import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'
import type { RateLimitResult } from '../lib/rateLimit.js'

export type StoredTokens = {
  accessToken: string
  refreshToken: string | null
  accessTokenExpiresAt: string | null
  scope: string[]
}

export type StoredSession = {
  id: string
  account: XAccountSummary
  tokens: StoredTokens
  createdAt: string
  lastSeenAt: string
}

export type AuthTransaction = {
  verifier: string
  createdAt: number
}

export type StoredBookmarkFeed = {
  items: BookmarkRecord[]
  lastSyncedAt: string | null
}

export interface AppStore {
  readonly kind: 'memory' | 'postgres'
  createAuthTransaction(verifier: string): Promise<string>
  consumeAuthTransaction(state: string): Promise<AuthTransaction | null>
  createSession(account: XAccountSummary, tokens: StoredTokens): Promise<string>
  getSession(id: string | undefined): Promise<StoredSession | null>
  updateSessionTokens(id: string, tokens: StoredTokens): Promise<StoredSession | null>
  deleteSession(id: string | undefined): Promise<void>
  getBookmarks(xUserId: string): Promise<StoredBookmarkFeed>
  replaceBookmarks(xUserId: string, items: BookmarkRecord[]): Promise<StoredBookmarkFeed>
  checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
  close(): Promise<void>
}
