import { createHash, randomBytes } from 'node:crypto'

import { serverConfig } from '../config.js'

type TokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

function toBase64Url(value: Buffer | string) {
  const source = typeof value === 'string' ? Buffer.from(value) : value
  return source
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

export function createCodeVerifier() {
  return toBase64Url(randomBytes(64))
}

export function createCodeChallenge(verifier: string) {
  return toBase64Url(createHash('sha256').update(verifier).digest())
}

export function buildAuthorizeUrl(state: string, challenge: string) {
  const url = new URL(serverConfig.X_AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', serverConfig.X_CLIENT_ID ?? '')
  url.searchParams.set('redirect_uri', serverConfig.xRedirectUri)
  url.searchParams.set('scope', serverConfig.xScopes.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

async function requestToken(params: URLSearchParams) {
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  }

  if (serverConfig.X_CLIENT_SECRET) {
    headers.authorization = `Basic ${Buffer.from(`${serverConfig.X_CLIENT_ID}:${serverConfig.X_CLIENT_SECRET}`).toString('base64')}`
  }

  const response = await fetch(`${serverConfig.X_API_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`X token exchange failed (${response.status}): ${text.slice(0, 180)}`)
  }

  return (await response.json()) as TokenResponse
}

export async function exchangeCodeForTokens(code: string, verifier: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: serverConfig.xRedirectUri,
    client_id: serverConfig.X_CLIENT_ID ?? '',
    code_verifier: verifier,
  })

  const tokenResponse = await requestToken(params)

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? null,
    accessTokenExpiresAt: tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null,
    scope: tokenResponse.scope?.split(/\s+/).filter(Boolean) ?? serverConfig.xScopes,
  }
}

export async function refreshTokens(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: serverConfig.X_CLIENT_ID ?? '',
  })

  const tokenResponse = await requestToken(params)

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? refreshToken,
    accessTokenExpiresAt: tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null,
    scope: tokenResponse.scope?.split(/\s+/).filter(Boolean) ?? serverConfig.xScopes,
  }
}
