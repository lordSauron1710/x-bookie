import { randomUUID } from 'node:crypto'

import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'

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

type AuthTransaction = {
  verifier: string
  createdAt: number
}

type StoredBookmarkFeed = {
  items: BookmarkRecord[]
  lastSyncedAt: string | null
}

const AUTH_TTL_MS = 10 * 60 * 1000

export class MemoryStore {
  private readonly authTransactions = new Map<string, AuthTransaction>()
  private readonly sessions = new Map<string, StoredSession>()
  private readonly bookmarksByUser = new Map<string, StoredBookmarkFeed>()

  createAuthTransaction(verifier: string) {
    const state = randomUUID()
    this.authTransactions.set(state, {
      verifier,
      createdAt: Date.now(),
    })
    this.pruneAuthTransactions()
    return state
  }

  consumeAuthTransaction(state: string) {
    const transaction = this.authTransactions.get(state)
    this.authTransactions.delete(state)

    if (!transaction) return null
    if (Date.now() - transaction.createdAt > AUTH_TTL_MS) return null
    return transaction
  }

  createSession(account: XAccountSummary, tokens: StoredTokens) {
    const id = randomUUID()
    const now = new Date().toISOString()

    this.sessions.set(id, {
      id,
      account,
      tokens,
      createdAt: now,
      lastSeenAt: now,
    })

    return id
  }

  getSession(id: string | undefined) {
    if (!id) return null

    const session = this.sessions.get(id)
    if (!session) return null

    session.lastSeenAt = new Date().toISOString()
    return session
  }

  updateSessionTokens(id: string, tokens: StoredTokens) {
    const session = this.sessions.get(id)
    if (!session) return null

    session.tokens = tokens
    session.lastSeenAt = new Date().toISOString()
    return session
  }

  deleteSession(id: string | undefined) {
    if (!id) return
    this.sessions.delete(id)
  }

  getBookmarks(xUserId: string) {
    return this.bookmarksByUser.get(xUserId) ?? { items: [], lastSyncedAt: null }
  }

  replaceBookmarks(xUserId: string, items: BookmarkRecord[]) {
    const feed = {
      items,
      lastSyncedAt: new Date().toISOString(),
    }

    this.bookmarksByUser.set(xUserId, feed)
    return feed
  }

  private pruneAuthTransactions() {
    const now = Date.now()

    for (const [state, transaction] of this.authTransactions.entries()) {
      if (now - transaction.createdAt > AUTH_TTL_MS) {
        this.authTransactions.delete(state)
      }
    }
  }
}

export const store = new MemoryStore()
