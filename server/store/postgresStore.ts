import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool, type PoolClient } from 'pg'

import type { BookmarkRecord, XAccountSummary } from '../../shared/contracts.js'
import { serverConfig } from '../config.js'
import { decryptToken, encryptToken } from '../lib/tokenCrypto.js'
import type { AppStore, AuthTransaction, StoredBookmarkFeed, StoredSession, StoredTokens } from './types.js'

const AUTH_TTL_MS = 10 * 60 * 1000

type UserRow = {
  user_id: string
  x_user_id: string
  x_handle: string
  x_name: string
  x_profile_image_url: string | null
}

type SessionRow = {
  session_id: string
  created_at: Date
  last_seen_at: Date
  session_expires_at: Date
}

type ConnectionRow = {
  access_token_ciphertext: string
  refresh_token_ciphertext: string | null
  scope: string[] | null
  token_expires_at: Date | null
}

type BookmarkRow = {
  x_post_id: string
  text: string
  author_name: string
  author_handle: string
  url: string
  tweet_created_at: Date | null
  synced_at: Date
}

type RateLimitRow = {
  count: number
  reset_at: Date
}

function accessTokenExpiresAt(value: string | null) {
  return value ? new Date(value) : null
}

function requireEncryptionKey() {
  if (!serverConfig.TOKEN_ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be configured when DATABASE_URL is set.')
  }

  return serverConfig.TOKEN_ENCRYPTION_KEY
}

function toStoredSession(user: UserRow, session: SessionRow, connection: ConnectionRow): StoredSession {
  const encryptionKey = requireEncryptionKey()

  return {
    id: session.session_id,
    createdAt: session.created_at.toISOString(),
    lastSeenAt: session.last_seen_at.toISOString(),
    account: {
      xUserId: user.x_user_id,
      username: user.x_handle,
      name: user.x_name,
      profileImageUrl: user.x_profile_image_url,
    },
    tokens: {
      accessToken: decryptToken(connection.access_token_ciphertext, encryptionKey),
      refreshToken: connection.refresh_token_ciphertext
        ? decryptToken(connection.refresh_token_ciphertext, encryptionKey)
        : null,
      accessTokenExpiresAt: connection.token_expires_at?.toISOString() ?? null,
      scope: connection.scope ?? [],
    },
  }
}

function toBookmarkRecord(row: BookmarkRow): BookmarkRecord {
  return {
    id: row.x_post_id,
    text: row.text,
    author: row.author_name,
    handle: row.author_handle,
    url: row.url,
    createdAt: row.tweet_created_at?.toISOString() ?? null,
  }
}

async function initializeSchema(pool: Pool) {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql')
  const schemaSql = await readFile(schemaPath, 'utf8')
  await pool.query(schemaSql)
}

export class PostgresStore implements AppStore {
  readonly kind = 'postgres' as const

  constructor(private readonly pool: Pool) {}

  async createAuthTransaction(verifier: string) {
    const state = randomUUID()

    await this.pool.query(
      `
        insert into oauth_transactions (state, verifier, created_at)
        values ($1, $2, now())
      `,
      [state, verifier],
    )

    await this.pool.query(
      `
        delete from oauth_transactions
        where created_at < now() - interval '10 minutes'
      `,
    )

    return state
  }

  async consumeAuthTransaction(state: string): Promise<AuthTransaction | null> {
    const result = await this.pool.query<{ verifier: string; created_at: Date }>(
      `
        delete from oauth_transactions
        where state = $1
        returning verifier, created_at
      `,
      [state],
    )

    const row = result.rows[0]
    if (!row) return null

    const createdAt = row.created_at.getTime()
    if (Date.now() - createdAt > AUTH_TTL_MS) {
      return null
    }

    return {
      verifier: row.verifier,
      createdAt,
    }
  }

  async createSession(account: XAccountSummary, tokens: StoredTokens) {
    const client = await this.pool.connect()
    const sessionId = randomUUID()

    try {
      await client.query('begin')
      const userId = await this.upsertUser(client, account)
      await this.upsertConnection(client, userId, tokens)

      await client.query(
        `
          insert into user_sessions (session_id, user_id, expires_at, created_at, last_seen_at)
          values ($1, $2, now() + interval '14 days', now(), now())
        `,
        [sessionId, userId],
      )

      await client.query('commit')
      return sessionId
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  async getSession(id: string | undefined) {
    if (!id) return null

    const result = await this.pool.query<UserRow & SessionRow & ConnectionRow>(
      `
        select
          sessions.session_id,
          sessions.created_at,
          sessions.last_seen_at,
          sessions.expires_at as session_expires_at,
          users.user_id,
          users.x_user_id,
          users.x_handle,
          users.x_name,
          users.x_profile_image_url,
          connections.access_token_ciphertext,
          connections.refresh_token_ciphertext,
          connections.scope,
          connections.expires_at as token_expires_at
        from user_sessions sessions
        join app_users users on users.user_id = sessions.user_id
        join x_connections connections on connections.user_id = users.user_id
        where sessions.session_id = $1
      `,
      [id],
    )

    const row = result.rows[0]
    if (!row) return null

    if (row.session_expires_at.getTime() <= Date.now()) {
      await this.deleteSession(id)
      return null
    }

    await this.pool.query(
      `
        update user_sessions
        set last_seen_at = now()
        where session_id = $1
      `,
      [id],
    )

    return toStoredSession(row, row, row)
  }

  async updateSessionTokens(id: string, tokens: StoredTokens) {
    const result = await this.pool.query<{ user_id: string }>(
      `
        select user_id
        from user_sessions
        where session_id = $1
      `,
      [id],
    )

    const userId = result.rows[0]?.user_id
    if (!userId) return null

    await this.upsertConnection(this.pool, userId, tokens)
    return this.getSession(id)
  }

  async deleteSession(id: string | undefined) {
    if (!id) return

    await this.pool.query(
      `
        delete from user_sessions
        where session_id = $1
      `,
      [id],
    )
  }

  async getBookmarks(xUserId: string) {
    const userResult = await this.pool.query<{ user_id: string }>(
      `
        select user_id
        from app_users
        where x_user_id = $1
      `,
      [xUserId],
    )

    const userId = userResult.rows[0]?.user_id
    if (!userId) {
      return { items: [], lastSyncedAt: null }
    }

    const result = await this.pool.query<BookmarkRow>(
      `
        select x_post_id, text, author_name, author_handle, url, tweet_created_at, synced_at
        from user_bookmarks
        where user_id = $1
        order by synced_at desc, x_post_id asc
      `,
      [userId],
    )

    return {
      items: result.rows.map(toBookmarkRecord),
      lastSyncedAt: result.rows[0]?.synced_at.toISOString() ?? null,
    }
  }

  async replaceBookmarks(xUserId: string, items: BookmarkRecord[]): Promise<StoredBookmarkFeed> {
    const client = await this.pool.connect()

    try {
      await client.query('begin')
      const userResult = await client.query<{ user_id: string }>(
        `
          select user_id
          from app_users
          where x_user_id = $1
        `,
        [xUserId],
      )

      const userId = userResult.rows[0]?.user_id
      if (!userId) {
        throw new Error('Cannot store bookmarks for an unknown user.')
      }

      await client.query(
        `
          delete from user_bookmarks
          where user_id = $1
        `,
        [userId],
      )

      const syncedAt = new Date().toISOString()

      for (const item of items) {
        await client.query(
          `
            insert into user_bookmarks (
              user_id,
              x_post_id,
              text,
              author_name,
              author_handle,
              url,
              tweet_created_at,
              raw_payload,
              synced_at
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
          `,
          [
            userId,
            item.id,
            item.text,
            item.author,
            item.handle,
            item.url,
            item.createdAt,
            JSON.stringify(item),
            syncedAt,
          ],
        )
      }

      await client.query('commit')
      return {
        items,
        lastSyncedAt: syncedAt,
      }
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  async checkRateLimit(key: string, limit: number, windowMs: number) {
    const result = await this.pool.query<RateLimitRow>(
      `
        insert into rate_limit_buckets (bucket_key, count, reset_at)
        values ($1, 1, now() + ($2 * interval '1 millisecond'))
        on conflict (bucket_key) do update
        set
          count = case
            when rate_limit_buckets.reset_at <= now() then 1
            else rate_limit_buckets.count + 1
          end,
          reset_at = case
            when rate_limit_buckets.reset_at <= now() then now() + ($2 * interval '1 millisecond')
            else rate_limit_buckets.reset_at
          end
        returning count, reset_at
      `,
      [key, windowMs],
    )

    const row = result.rows[0]
    const retryAfterSeconds = Math.max(1, Math.ceil((row.reset_at.getTime() - Date.now()) / 1000))

    await this.pool.query(
      `
        delete from rate_limit_buckets
        where reset_at <= now()
      `,
    )

    if (row.count > limit) {
      return {
        allowed: false,
        retryAfterSeconds,
      }
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
    }
  }

  async close() {
    await this.pool.end()
  }

  private async upsertUser(client: Pool | PoolClient, account: XAccountSummary) {
    const userId = randomUUID()
    const result = await client.query<{ user_id: string }>(
      `
        insert into app_users (user_id, x_user_id, x_handle, x_name, x_profile_image_url, created_at, updated_at)
        values ($1, $2, $3, $4, $5, now(), now())
        on conflict (x_user_id) do update
        set
          x_handle = excluded.x_handle,
          x_name = excluded.x_name,
          x_profile_image_url = excluded.x_profile_image_url,
          updated_at = now()
        returning user_id
      `,
      [userId, account.xUserId, account.username, account.name, account.profileImageUrl],
    )

    return result.rows[0].user_id
  }

  private async upsertConnection(client: Pool | PoolClient, userId: string, tokens: StoredTokens) {
    const encryptionKey = requireEncryptionKey()

    await client.query(
      `
        insert into x_connections (
          user_id,
          access_token_ciphertext,
          refresh_token_ciphertext,
          scope,
          token_type,
          expires_at,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, 'Bearer', $5, now(), now())
        on conflict (user_id) do update
        set
          access_token_ciphertext = excluded.access_token_ciphertext,
          refresh_token_ciphertext = excluded.refresh_token_ciphertext,
          scope = excluded.scope,
          token_type = excluded.token_type,
          expires_at = excluded.expires_at,
          updated_at = now()
      `,
      [
        userId,
        encryptToken(tokens.accessToken, encryptionKey),
        tokens.refreshToken ? encryptToken(tokens.refreshToken, encryptionKey) : null,
        tokens.scope,
        accessTokenExpiresAt(tokens.accessTokenExpiresAt),
      ],
    )
  }
}

export async function createPostgresStore() {
  const pool = new Pool({
    connectionString: serverConfig.DATABASE_URL,
    ssl: serverConfig.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  })

  await initializeSchema(pool)
  return new PostgresStore(pool)
}
