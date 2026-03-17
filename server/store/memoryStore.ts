import { randomUUID } from 'node:crypto'

import type { BookmarkRecord } from '../../shared/contracts.js'
import { checkRateLimitInBuckets, createRateLimitBuckets } from '../lib/rateLimit.js'
import type { AppStore, AuthTransaction, StoredBookmarkFeed, StoredSession, StoredTokens } from './types.js'

const AUTH_TTL_MS = 10 * 60 * 1000

export class MemoryStore implements AppStore {
  readonly kind = 'memory' as const
  private readonly authTransactions = new Map<string, AuthTransaction>()
  private readonly sessions = new Map<string, StoredSession>()
  private readonly bookmarksByUser = new Map<string, StoredBookmarkFeed>()
  private readonly rateLimitBuckets = createRateLimitBuckets()

  async createAuthTransaction(verifier: string) {
    const state = randomUUID()
    this.authTransactions.set(state, {
      verifier,
      createdAt: Date.now(),
    })
    this.pruneAuthTransactions()
    return state
  }

  async consumeAuthTransaction(state: string) {
    const transaction = this.authTransactions.get(state)
    this.authTransactions.delete(state)

    if (!transaction) return null
    if (Date.now() - transaction.createdAt > AUTH_TTL_MS) return null
    return transaction
  }

  async createSession(account: StoredSession['account'], tokens: StoredTokens) {
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

  async getSession(id: string | undefined) {
    if (!id) return null

    const session = this.sessions.get(id)
    if (!session) return null

    session.lastSeenAt = new Date().toISOString()
    return session
  }

  async updateSessionTokens(id: string, tokens: StoredTokens) {
    const session = this.sessions.get(id)
    if (!session) return null

    session.tokens = tokens
    session.lastSeenAt = new Date().toISOString()
    return session
  }

  async deleteSession(id: string | undefined) {
    if (!id) return
    this.sessions.delete(id)
  }

  async getBookmarks(xUserId: string) {
    return this.bookmarksByUser.get(xUserId) ?? { items: [], lastSyncedAt: null }
  }

  async replaceBookmarks(xUserId: string, items: BookmarkRecord[]) {
    const feed = {
      items,
      lastSyncedAt: new Date().toISOString(),
    }

    this.bookmarksByUser.set(xUserId, feed)
    return feed
  }

  async checkRateLimit(key: string, limit: number, windowMs: number) {
    return checkRateLimitInBuckets(this.rateLimitBuckets, key, limit, windowMs)
  }

  private pruneAuthTransactions() {
    const now = Date.now()

    for (const [state, transaction] of this.authTransactions.entries()) {
      if (now - transaction.createdAt > AUTH_TTL_MS) {
        this.authTransactions.delete(state)
      }
    }
  }

  async close() {
    this.authTransactions.clear()
    this.sessions.clear()
    this.bookmarksByUser.clear()
    this.rateLimitBuckets.clear()
  }
}

export function createMemoryStore() {
  return new MemoryStore()
}
