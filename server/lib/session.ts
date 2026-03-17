import type { Request, Response } from 'express'

import type { StoredSession } from '../store/memoryStore.js'
import { store } from '../store/memoryStore.js'

const authCookieName = 'xbookie_oauth_state'
const sessionCookieName = 'xbookie_session'

type CookieOptions = {
  httpOnly: true
  sameSite: 'lax'
  secure: boolean
  signed: true
  path: '/'
  maxAge?: number
  expires?: Date
}

function baseCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    signed: true,
    path: '/',
  }
}

export function setOAuthStateCookie(response: Response, state: string, secure: boolean) {
  response.cookie(authCookieName, state, {
    ...baseCookieOptions(secure),
    maxAge: 10 * 60 * 1000,
  })
}

export function clearOAuthStateCookie(response: Response, secure: boolean) {
  response.cookie(authCookieName, '', {
    ...baseCookieOptions(secure),
    expires: new Date(0),
  })
}

export function getOAuthStateCookie(request: Request) {
  return request.signedCookies[authCookieName] as string | undefined
}

export function setSessionCookie(response: Response, session: StoredSession, secure: boolean) {
  response.cookie(sessionCookieName, session.id, {
    ...baseCookieOptions(secure),
    maxAge: 14 * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(response: Response, secure: boolean) {
  response.cookie(sessionCookieName, '', {
    ...baseCookieOptions(secure),
    expires: new Date(0),
  })
}

export function getSessionFromRequest(request: Request) {
  const sessionId = request.signedCookies[sessionCookieName] as string | undefined
  return store.getSession(sessionId)
}
