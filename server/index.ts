import cookieParser from 'cookie-parser'
import express from 'express'
import { z } from 'zod'

import type { BookmarksResponse, SessionResponse, SyncBookmarksResponse } from '../shared/contracts.js'
import { serverConfig } from './config.js'
import { checkRateLimit } from './lib/rateLimit.js'
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  getOAuthStateCookie,
  getSessionFromRequest,
  setOAuthStateCookie,
  setSessionCookie,
} from './lib/session.js'
import { fetchViewer } from './lib/xClient.js'
import { buildAuthorizeUrl, createCodeChallenge, createCodeVerifier, exchangeCodeForTokens } from './lib/xOAuth.js'
import { syncBookmarksForSession } from './lib/xSync.js'
import { store } from './store/memoryStore.js'

const callbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
})

const app = express()

app.disable('x-powered-by')
app.use(cookieParser(serverConfig.SESSION_COOKIE_SECRET))
app.use(express.json({ limit: '512kb' }))

app.use((request, response, next) => {
  void request
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/session', (request, response) => {
  const session = getSessionFromRequest(request)

  const payload: SessionResponse = session
    ? {
        authenticated: true,
        xAuthConfigured: serverConfig.xAuthConfigured,
        account: session.account,
        bookmarkCount: store.getBookmarks(session.account.xUserId).items.length,
        lastSyncedAt: store.getBookmarks(session.account.xUserId).lastSyncedAt,
      }
    : {
        authenticated: false,
        xAuthConfigured: serverConfig.xAuthConfigured,
        account: null,
        bookmarkCount: 0,
        lastSyncedAt: null,
      }

  response.json(payload)
})

app.get('/api/auth/x/start', (request, response) => {
  if (!serverConfig.xAuthConfigured) {
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('X auth is not configured yet.')}`)
    return
  }

  const limit = checkRateLimit(`auth-start:${request.ip}`, 20, 15 * 60 * 1000)
  if (!limit.allowed) {
    response.status(429).json({
      error: {
        code: 'rate_limited',
        message: `Try again in ${limit.retryAfterSeconds}s.`,
      },
    })
    return
  }

  const verifier = createCodeVerifier()
  const challenge = createCodeChallenge(verifier)
  const state = store.createAuthTransaction(verifier)

  setOAuthStateCookie(response, state, serverConfig.isProduction)
  response.redirect(buildAuthorizeUrl(state, challenge))
})

app.get('/api/auth/x/callback', async (request, response) => {
  const parsed = callbackQuerySchema.safeParse(request.query)

  if (!parsed.success) {
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('Invalid X callback parameters.')}`)
    return
  }

  if (parsed.data.error) {
    clearOAuthStateCookie(response, serverConfig.isProduction)
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent(parsed.data.error)}`)
    return
  }

  if (!parsed.data.code || !parsed.data.state) {
    clearOAuthStateCookie(response, serverConfig.isProduction)
    response.redirect(
      `${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('X did not return a valid authorization code.')}`,
    )
    return
  }

  const cookieState = getOAuthStateCookie(request)
  clearOAuthStateCookie(response, serverConfig.isProduction)

  if (!cookieState || cookieState !== parsed.data.state) {
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('The X login state was invalid or expired.')}`)
    return
  }

  const transaction = store.consumeAuthTransaction(parsed.data.state)
  if (!transaction) {
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('The X sign-in session expired. Please try again.')}`)
    return
  }

  try {
    const tokens = await exchangeCodeForTokens(parsed.data.code, transaction.verifier)
    const account = await fetchViewer(tokens.accessToken)
    const sessionId = store.createSession(account, tokens)
    const session = store.getSession(sessionId)

    if (!session) {
      throw new Error('The app session could not be created.')
    }

    setSessionCookie(response, session, serverConfig.isProduction)
    response.redirect(`${serverConfig.APP_ORIGIN}/?auth=connected`)
  } catch {
    response.redirect(`${serverConfig.APP_ORIGIN}/?authError=${encodeURIComponent('X sign-in failed. Check your app settings and try again.')}`)
  }
})

app.post('/api/auth/logout', (request, response) => {
  const session = getSessionFromRequest(request)
  if (session) {
    store.deleteSession(session.id)
  }

  clearSessionCookie(response, serverConfig.isProduction)
  response.json({ ok: true })
})

app.get('/api/bookmarks', (request, response) => {
  const session = getSessionFromRequest(request)
  if (!session) {
    response.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Sign in with X to continue.',
      },
    })
    return
  }

  const feed = store.getBookmarks(session.account.xUserId)
  const payload: BookmarksResponse = {
    items: feed.items,
    total: feed.items.length,
    lastSyncedAt: feed.lastSyncedAt,
  }

  response.json(payload)
})

app.post('/api/bookmarks/sync', async (request, response) => {
  const session = getSessionFromRequest(request)
  if (!session) {
    response.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Sign in with X to continue.',
      },
    })
    return
  }

  const limit = checkRateLimit(`bookmark-sync:${session.account.xUserId}`, 30, 15 * 60 * 1000)
  if (!limit.allowed) {
    response.status(429).json({
      error: {
        code: 'rate_limited',
        message: `Try again in ${limit.retryAfterSeconds}s.`,
      },
    })
    return
  }

  try {
    const feed = await syncBookmarksForSession(session)
    const payload: SyncBookmarksResponse = {
      syncedCount: feed.items.length,
      totalStored: feed.items.length,
      lastSyncedAt: feed.lastSyncedAt,
    }

    response.json(payload)
  } catch {
    response.status(502).json({
      error: {
        code: 'x_sync_failed',
        message: 'Bookmark sync failed. Check your X app configuration and try again.',
      },
    })
  }
})

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: 'not_found',
      message: 'Route not found.',
    },
  })
})

app.listen(serverConfig.PORT, () => {
  console.log(`x-bookie API listening on http://localhost:${serverConfig.PORT}`)
})
