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
import { createStore } from './store/index.js'
import type { AppStore } from './store/types.js'

const callbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
})

type AppDependencies = {
  checkRateLimit: typeof checkRateLimit
  createCodeVerifier: typeof createCodeVerifier
  createCodeChallenge: typeof createCodeChallenge
  buildAuthorizeUrl: typeof buildAuthorizeUrl
  exchangeCodeForTokens: typeof exchangeCodeForTokens
  fetchViewer: typeof fetchViewer
  syncBookmarksForSession: typeof syncBookmarksForSession
}

const defaultDependencies: AppDependencies = {
  checkRateLimit,
  createCodeVerifier,
  createCodeChallenge,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchViewer,
  syncBookmarksForSession,
}

export function createApp(
  store: AppStore,
  dependencyOverrides: Partial<AppDependencies> = {},
  config: typeof serverConfig = serverConfig,
) {
  const app = express()
  const dependencies: AppDependencies = {
    ...defaultDependencies,
    ...dependencyOverrides,
  }

  app.disable('x-powered-by')
  app.use(cookieParser(config.SESSION_COOKIE_SECRET))
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
    response.json({ ok: true, store: store.kind })
  })

  app.get('/api/session', async (request, response) => {
    const session = await getSessionFromRequest(request, store)

    const payload: SessionResponse = session
      ? {
          authenticated: true,
          xAuthConfigured: config.xAuthConfigured,
          account: session.account,
          bookmarkCount: (await store.getBookmarks(session.account.xUserId)).items.length,
          lastSyncedAt: (await store.getBookmarks(session.account.xUserId)).lastSyncedAt,
        }
      : {
          authenticated: false,
          xAuthConfigured: config.xAuthConfigured,
          account: null,
          bookmarkCount: 0,
          lastSyncedAt: null,
        }

    response.json(payload)
  })

  app.get('/api/auth/x/start', async (request, response) => {
    if (!config.xAuthConfigured) {
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent('X auth is not configured yet.')}`)
      return
    }

    const limit = dependencies.checkRateLimit(`auth-start:${request.ip}`, 20, 15 * 60 * 1000)
    if (!limit.allowed) {
      response.status(429).json({
        error: {
          code: 'rate_limited',
          message: `Try again in ${limit.retryAfterSeconds}s.`,
        },
      })
      return
    }

    const verifier = dependencies.createCodeVerifier()
    const challenge = dependencies.createCodeChallenge(verifier)
    const state = await store.createAuthTransaction(verifier)

    setOAuthStateCookie(response, state, config.isProduction)
    response.redirect(dependencies.buildAuthorizeUrl(state, challenge))
  })

  app.get('/api/auth/x/callback', async (request, response) => {
    const parsed = callbackQuerySchema.safeParse(request.query)

    if (!parsed.success) {
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent('Invalid X callback parameters.')}`)
      return
    }

    if (parsed.data.error) {
      clearOAuthStateCookie(response, config.isProduction)
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent(parsed.data.error)}`)
      return
    }

    if (!parsed.data.code || !parsed.data.state) {
      clearOAuthStateCookie(response, config.isProduction)
      response.redirect(
        `${config.APP_ORIGIN}/?authError=${encodeURIComponent('X did not return a valid authorization code.')}`,
      )
      return
    }

    const cookieState = getOAuthStateCookie(request)
    clearOAuthStateCookie(response, config.isProduction)

    if (!cookieState || cookieState !== parsed.data.state) {
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent('The X login state was invalid or expired.')}`)
      return
    }

    const transaction = await store.consumeAuthTransaction(parsed.data.state)
    if (!transaction) {
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent('The X sign-in session expired. Please try again.')}`)
      return
    }

    try {
      const tokens = await dependencies.exchangeCodeForTokens(parsed.data.code, transaction.verifier)
      const account = await dependencies.fetchViewer(tokens.accessToken)
      const sessionId = await store.createSession(account, tokens)
      const session = await store.getSession(sessionId)

      if (!session) {
        throw new Error('The app session could not be created.')
      }

      setSessionCookie(response, session, config.isProduction)
      response.redirect(`${config.APP_ORIGIN}/?auth=connected`)
    } catch {
      response.redirect(`${config.APP_ORIGIN}/?authError=${encodeURIComponent('X sign-in failed. Check your app settings and try again.')}`)
    }
  })

  app.post('/api/auth/logout', async (request, response) => {
    const session = await getSessionFromRequest(request, store)
    if (session) {
      await store.deleteSession(session.id)
    }

    clearSessionCookie(response, config.isProduction)
    response.json({ ok: true })
  })

  app.get('/api/bookmarks', async (request, response) => {
    const session = await getSessionFromRequest(request, store)
    if (!session) {
      response.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Sign in with X to continue.',
        },
      })
      return
    }

    const feed = await store.getBookmarks(session.account.xUserId)
    const payload: BookmarksResponse = {
      items: feed.items,
      total: feed.items.length,
      lastSyncedAt: feed.lastSyncedAt,
    }

    response.json(payload)
  })

  app.post('/api/bookmarks/sync', async (request, response) => {
    const session = await getSessionFromRequest(request, store)
    if (!session) {
      response.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Sign in with X to continue.',
        },
      })
      return
    }

    const limit = dependencies.checkRateLimit(`bookmark-sync:${session.account.xUserId}`, 30, 15 * 60 * 1000)
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
      const feed = await dependencies.syncBookmarksForSession(session, store)
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

  return app
}

const store = await createStore()

export const app = createApp(store)

if (!process.env.VITEST) {
  app.listen(serverConfig.PORT, () => {
    console.log(`x-bookie API listening on http://localhost:${serverConfig.PORT}`)
  })
}
