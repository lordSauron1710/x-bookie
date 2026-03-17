/* @vitest-environment node */

process.env.APP_ORIGIN ??= 'http://localhost:5173'
process.env.API_ORIGIN ??= 'http://localhost:8787'
process.env.SESSION_COOKIE_SECRET ??= 'test-session-cookie-secret-1234567890'

import { createHmac } from 'node:crypto'

import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'

import type { BookmarkRecord, XAccountSummary } from '../shared/contracts.js'
import { serverConfig } from './config.js'
import { createApp } from './index.js'
import { createMemoryStore } from './store/memoryStore.js'
import type { StoredTokens } from './store/types.js'

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
  scope: ['bookmark.read', 'tweet.read', 'users.read'],
}

const syncedBookmark: BookmarkRecord = {
  id: 'bookmark-1',
  text: 'Alpha launch planning',
  author: 'Test User',
  handle: 'tester',
  url: 'https://x.com/tester/status/bookmark-1',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function buildConfig(overrides: Partial<typeof serverConfig> = {}): typeof serverConfig {
  return {
    ...serverConfig,
    APP_ORIGIN: 'http://localhost:5173',
    API_ORIGIN: 'http://localhost:8787',
    SESSION_COOKIE_SECRET: 'test-session-cookie-secret-1234567890',
    X_CLIENT_ID: 'client-id',
    X_CLIENT_SECRET: 'client-secret',
    xAuthConfigured: true,
    isProduction: false,
    xRedirectUri: 'http://localhost:8787/api/auth/x/callback',
    ...overrides,
  }
}

function signCookie(name: string, value: string, secret: string) {
  const signature = createHmac('sha256', secret).update(value).digest('base64').replace(/=+$/, '')
  return `${name}=${encodeURIComponent(`s:${value}.${signature}`)}`
}

async function createAuthenticatedContext() {
  const store = createMemoryStore()
  const config = buildConfig()
  const sessionId = await store.createSession(baseAccount, baseTokens)
  const app = createApp(
    store,
    {
      checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
    },
    config,
  )

  return {
    app,
    store,
    sessionId,
    sessionCookie: signCookie('xbookie_session', sessionId, config.SESSION_COOKIE_SECRET),
  }
}

describe('server routes', () => {
  test('GET /api/health exposes store kind and security headers', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig())

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true, store: 'memory' })
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()')
    await store.close()
  })

  test('returns JSON 404 payloads for unknown routes', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig())

    const response = await request(app).get('/api/missing')

    expect(response.status).toBe(404)
    expect(response.body.error).toEqual({
      code: 'not_found',
      message: 'Route not found.',
    })
    await store.close()
  })

  test('GET /api/session responds even when no cookie is set', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig())

    const response = await request(app).get('/api/session')

    expect(response.status).toBe(200)
    expect(response.body.authenticated).toBe(false)
    expect(response.body.xAuthConfigured).toBe(true)
    expect(response.body.classificationMode).toBe('heuristic')
    await store.close()
  })

  test('GET /api/session returns authenticated account and bookmark counts', async () => {
    const { app, store, sessionCookie } = await createAuthenticatedContext()
    const feed = await store.replaceBookmarks(baseAccount.xUserId, [syncedBookmark])

    const response = await request(app).get('/api/session').set('Cookie', sessionCookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      authenticated: true,
      xAuthConfigured: true,
      classificationMode: 'heuristic',
      account: baseAccount,
      bookmarkCount: 1,
      lastSyncedAt: feed.lastSyncedAt,
    })
    await store.close()
  })

  test('GET /api/bookmarks requires authentication', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig())

    await request(app)
      .get('/api/bookmarks')
      .expect(401)
      .expect((response) => {
        expect(response.body.error?.code).toBe('unauthorized')
      })
    await store.close()
  })

  test('GET /api/bookmarks returns the stored feed for an authenticated session', async () => {
    const { app, store, sessionCookie } = await createAuthenticatedContext()
    const feed = await store.replaceBookmarks(baseAccount.xUserId, [syncedBookmark])

    const response = await request(app).get('/api/bookmarks').set('Cookie', sessionCookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      items: [syncedBookmark],
      total: 1,
      lastSyncedAt: feed.lastSyncedAt,
    })
    await store.close()
  })

  test('GET /api/auth/x/start redirects to the app when X auth is not configured', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig({ xAuthConfigured: false, X_CLIENT_ID: undefined }))

    const response = await request(app).get('/api/auth/x/start')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(
      'http://localhost:5173/?authError=X%20auth%20is%20not%20configured%20yet.',
    )
    await store.close()
  })

  test('GET /api/auth/x/start returns 429 when rate limited', async () => {
    const store = createMemoryStore()
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: false, retryAfterSeconds: 42 }),
      },
      buildConfig(),
    )

    const response = await request(app).get('/api/auth/x/start')

    expect(response.status).toBe(429)
    expect(response.body.error).toEqual({
      code: 'rate_limited',
      message: 'Try again in 42s.',
    })
    await store.close()
  })

  test('GET /api/auth/x/start sets an oauth state cookie and redirects to X', async () => {
    const store = createMemoryStore()
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
        createCodeVerifier: () => 'verifier-1',
        createCodeChallenge: () => 'challenge-1',
        buildAuthorizeUrl: (state, challenge) => `https://x.com/authorize?state=${state}&challenge=${challenge}`,
      },
      buildConfig(),
    )

    const response = await request(app).get('/api/auth/x/start')

    expect(response.status).toBe(302)
    expect(response.headers.location).toMatch(/^https:\/\/x\.com\/authorize\?state=/)
    expect(response.headers.location).toContain('challenge=challenge-1')
    expect(response.headers['set-cookie'][0]).toContain('xbookie_oauth_state=')
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    await store.close()
  })

  test('GET /api/auth/x/callback rejects mismatched state cookies', async () => {
    const store = createMemoryStore()
    const config = buildConfig()
    const app = createApp(store, {}, config)
    const state = await store.createAuthTransaction('verifier-1')
    const cookie = signCookie('xbookie_oauth_state', 'different-state', config.SESSION_COOKIE_SECRET)

    const response = await request(app)
      .get(`/api/auth/x/callback?code=code-1&state=${state}`)
      .set('Cookie', cookie)

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(
      'http://localhost:5173/?authError=The%20X%20login%20state%20was%20invalid%20or%20expired.',
    )
    await store.close()
  })

  test('GET /api/auth/x/callback rejects expired sign-in sessions', async () => {
    const store = createMemoryStore()
    const config = buildConfig()
    const app = createApp(store, {}, config)
    const state = await store.createAuthTransaction('verifier-1')
    const cookie = signCookie('xbookie_oauth_state', state, config.SESSION_COOKIE_SECRET)

    await store.consumeAuthTransaction(state)

    const response = await request(app)
      .get(`/api/auth/x/callback?code=code-1&state=${state}`)
      .set('Cookie', cookie)

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(
      'http://localhost:5173/?authError=The%20X%20sign-in%20session%20expired.%20Please%20try%20again.',
    )
    await store.close()
  })

  test('GET /api/auth/x/callback creates a signed session on success', async () => {
    const store = createMemoryStore()
    const config = buildConfig()
    const exchangeCodeForTokens = vi.fn().mockResolvedValue(baseTokens)
    const fetchViewer = vi.fn().mockResolvedValue(baseAccount)
    const app = createApp(store, { exchangeCodeForTokens, fetchViewer }, config)
    const state = await store.createAuthTransaction('verifier-1')
    const oauthCookie = signCookie('xbookie_oauth_state', state, config.SESSION_COOKIE_SECRET)

    const callbackResponse = await request(app)
      .get(`/api/auth/x/callback?code=code-1&state=${state}`)
      .set('Cookie', oauthCookie)

    expect(callbackResponse.status).toBe(302)
    expect(callbackResponse.headers.location).toBe('http://localhost:5173/?auth=connected')
    expect(callbackResponse.headers['set-cookie'][1]).toContain('xbookie_session=')
    expect(exchangeCodeForTokens).toHaveBeenCalledWith('code-1', 'verifier-1')
    expect(fetchViewer).toHaveBeenCalledWith('access-1')

    const sessionCookie = callbackResponse.headers['set-cookie'][1].split(';')[0]
    const sessionResponse = await request(app).get('/api/session').set('Cookie', sessionCookie)
    expect(sessionResponse.body.authenticated).toBe(true)
    expect(sessionResponse.body.account).toEqual(baseAccount)
    await store.close()
  })

  test('GET /api/auth/x/callback redirects with auth error on exchange failure', async () => {
    const store = createMemoryStore()
    const config = buildConfig()
    const app = createApp(
      store,
      {
        exchangeCodeForTokens: vi.fn().mockRejectedValue(new Error('boom')),
      },
      config,
    )
    const state = await store.createAuthTransaction('verifier-1')
    const cookie = signCookie('xbookie_oauth_state', state, config.SESSION_COOKIE_SECRET)

    const response = await request(app)
      .get(`/api/auth/x/callback?code=code-1&state=${state}`)
      .set('Cookie', cookie)

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(
      'http://localhost:5173/?authError=X%20sign-in%20failed.%20Check%20your%20app%20settings%20and%20try%20again.',
    )
    await store.close()
  })

  test('POST /api/auth/logout clears the session cookie and deletes the session', async () => {
    const { app, store, sessionCookie, sessionId } = await createAuthenticatedContext()

    const response = await request(app).post('/api/auth/logout').set('Cookie', sessionCookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
    expect(response.headers['set-cookie'][0]).toContain('xbookie_session=')
    expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    await expect(store.getSession(sessionId)).resolves.toBeNull()
    await store.close()
  })

  test('POST /api/bookmarks/sync requires authentication', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig())

    await request(app)
      .post('/api/bookmarks/sync')
      .expect(401)
      .expect((response) => {
        expect(response.body.error?.message).toMatch(/Sign in with X/)
      })
    await store.close()
  })

  test('POST /api/bookmarks/sync rejects foreign origins', async () => {
    const { app, store, sessionCookie } = await createAuthenticatedContext()

    const response = await request(app)
      .post('/api/bookmarks/sync')
      .set('Cookie', sessionCookie)
      .set('Origin', 'https://evil.example')

    expect(response.status).toBe(403)
    expect(response.body.error).toEqual({
      code: 'forbidden_origin',
      message: 'Requests must originate from the app origin.',
    })
    await store.close()
  })

  test('POST /api/bookmarks/sync returns sync payloads for authenticated sessions', async () => {
    const { store, sessionCookie } = await createAuthenticatedContext()
    const syncBookmarksForSession = vi.fn().mockResolvedValue({
      items: [syncedBookmark],
      lastSyncedAt: '2026-01-02T00:00:00.000Z',
    })
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
        syncBookmarksForSession,
      },
      buildConfig(),
    )

    const response = await request(app).post('/api/bookmarks/sync').set('Cookie', sessionCookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      syncedCount: 1,
      totalStored: 1,
      lastSyncedAt: '2026-01-02T00:00:00.000Z',
    })
    expect(syncBookmarksForSession).toHaveBeenCalledTimes(1)
    await store.close()
  })

  test('POST /api/bookmarks/sync returns 429 when rate limited', async () => {
    const { store, sessionCookie } = await createAuthenticatedContext()
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: false, retryAfterSeconds: 9 }),
      },
      buildConfig(),
    )

    const response = await request(app).post('/api/bookmarks/sync').set('Cookie', sessionCookie)

    expect(response.status).toBe(429)
    expect(response.body.error).toEqual({
      code: 'rate_limited',
      message: 'Try again in 9s.',
    })
    await store.close()
  })

  test('POST /api/bookmarks/sync returns 502 when sync fails upstream', async () => {
    const { store, sessionCookie } = await createAuthenticatedContext()
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
        syncBookmarksForSession: vi.fn().mockRejectedValue(new Error('x failed')),
      },
      buildConfig(),
    )

    const response = await request(app).post('/api/bookmarks/sync').set('Cookie', sessionCookie)

    expect(response.status).toBe(502)
    expect(response.body.error).toEqual({
      code: 'x_sync_failed',
      message: 'Bookmark sync failed. Check your X app configuration and try again.',
    })
    await store.close()
  })

  test('POST /api/bookmarks/classify requires authentication', async () => {
    const store = createMemoryStore()
    const app = createApp(store, {}, buildConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-5-mini' }))

    await request(app)
      .post('/api/bookmarks/classify')
      .send({ bookmarks: [syncedBookmark], interests: [] })
      .expect(401)
      .expect((response) => {
        expect(response.body.error?.code).toBe('unauthorized')
      })
    await store.close()
  })

  test('POST /api/bookmarks/classify returns 503 when the model classifier is not configured', async () => {
    const { app, store, sessionCookie } = await createAuthenticatedContext()

    const response = await request(app)
      .post('/api/bookmarks/classify')
      .set('Cookie', sessionCookie)
      .send({
        bookmarks: [syncedBookmark],
        interests: [{ id: 'alpha', label: 'Alpha', description: 'Alpha topics', keywords: ['alpha'] }],
      })

    expect(response.status).toBe(503)
    expect(response.body.error).toEqual({
      code: 'classifier_unavailable',
      message: 'Model-backed classification is not configured for this environment.',
    })
    await store.close()
  })

  test('POST /api/bookmarks/classify returns model suggestions when configured', async () => {
    const { store, sessionCookie } = await createAuthenticatedContext()
    const classifyBookmarks = vi.fn().mockResolvedValue([
      {
        bookmarkId: syncedBookmark.id,
        interestId: 'alpha',
        confidence: 0.84,
        signals: ['Launch planning'],
        contentType: 'Launch',
        actionLane: 'Build',
        reason: 'The bookmark is about launch execution.',
      },
    ])
    const app = createApp(
      store,
      {
        checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
        classifyBookmarks,
      },
      buildConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-5-mini' }),
    )

    const response = await request(app)
      .post('/api/bookmarks/classify')
      .set('Cookie', sessionCookie)
      .send({
        bookmarks: [syncedBookmark],
        interests: [{ id: 'alpha', label: 'Alpha', description: 'Alpha topics', keywords: ['alpha'] }],
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      items: [
        {
          bookmarkId: syncedBookmark.id,
          interestId: 'alpha',
          confidence: 0.84,
          signals: ['Launch planning'],
          contentType: 'Launch',
          actionLane: 'Build',
          reason: 'The bookmark is about launch execution.',
        },
      ],
      mode: 'model',
      model: 'gpt-5-mini',
    })
    expect(classifyBookmarks).toHaveBeenCalledTimes(1)
    await store.close()
  })
})
