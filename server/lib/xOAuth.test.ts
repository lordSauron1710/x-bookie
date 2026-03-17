/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const envSnapshot = { ...process.env }

async function loadOAuthModule(envOverrides: Record<string, string | undefined> = {}) {
  vi.resetModules()

  process.env = {
    ...envSnapshot,
    NODE_ENV: 'test',
    API_ORIGIN: 'http://localhost:8787',
    X_CLIENT_ID: 'client-id',
    X_CLIENT_SECRET: 'client-secret',
    X_AUTHORIZE_URL: 'https://x.com/i/oauth2/authorize',
    X_API_BASE_URL: 'https://api.x.com/2',
    X_SCOPES: 'bookmark.read tweet.read users.read',
    ...envOverrides,
  }

  return import('./xOAuth.js')
}

describe('xOAuth helpers', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    process.env = { ...envSnapshot }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('creates URL-safe PKCE verifier values', async () => {
    const { createCodeVerifier } = await loadOAuthModule()
    const verifier = createCodeVerifier()

    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(verifier.length).toBeGreaterThanOrEqual(80)
  })

  test('creates RFC-compliant S256 code challenges', async () => {
    const { createCodeChallenge } = await loadOAuthModule()
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

    expect(createCodeChallenge(verifier)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  test('builds authorize URL with expected OAuth params', async () => {
    const { buildAuthorizeUrl } = await loadOAuthModule()
    const url = new URL(buildAuthorizeUrl('state-123', 'challenge-abc'))

    expect(url.origin + url.pathname).toBe('https://x.com/i/oauth2/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('client-id')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8787/api/auth/x/callback')
    expect(url.searchParams.get('scope')).toBe('bookmark.read tweet.read users.read')
    expect(url.searchParams.get('state')).toBe('state-123')
    expect(url.searchParams.get('code_challenge')).toBe('challenge-abc')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  })

  test('exchanges authorization codes for tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        expires_in: 300,
        scope: 'bookmark.read users.read',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const { exchangeCodeForTokens } = await loadOAuthModule()
    const result = await exchangeCodeForTokens('auth-code', 'verifier-1')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.x.com/2/oauth2/token')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'content-type': 'application/x-www-form-urlencoded',
    })
    expect((init.headers as Record<string, string>).authorization).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
    )
    expect(String(init.body)).toContain('grant_type=authorization_code')
    expect(String(init.body)).toContain('code=auth-code')
    expect(String(init.body)).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A8787%2Fapi%2Fauth%2Fx%2Fcallback')
    expect(String(init.body)).toContain('client_id=client-id')
    expect(String(init.body)).toContain('code_verifier=verifier-1')
    expect(result).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAt: '2026-01-01T00:05:00.000Z',
      scope: ['bookmark.read', 'users.read'],
    })
  })

  test('falls back to configured scopes when token scope is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-1',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { exchangeCodeForTokens } = await loadOAuthModule()
    const result = await exchangeCodeForTokens('auth-code', 'verifier-1')

    expect(result.scope).toEqual(['bookmark.read', 'tweet.read', 'users.read'])
    expect(result.refreshToken).toBeNull()
    expect(result.accessTokenExpiresAt).toBeNull()
  })

  test('refreshes tokens and keeps existing refresh token when X omits one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-2',
        expires_in: 120,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const { refreshTokens } = await loadOAuthModule()
    const result = await refreshTokens('refresh-original')

    expect(String(fetchMock.mock.calls[0][1].body)).toContain('grant_type=refresh_token')
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('refresh_token=refresh-original')
    expect(result).toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-original',
      accessTokenExpiresAt: '2026-01-01T00:02:00.000Z',
      scope: ['bookmark.read', 'tweet.read', 'users.read'],
    })
  })

  test('throws clear errors when token exchange fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'bad_credentials',
    })
    vi.stubGlobal('fetch', fetchMock)

    const { exchangeCodeForTokens } = await loadOAuthModule()
    await expect(exchangeCodeForTokens('bad-code', 'verifier')).rejects.toThrow(
      'X token exchange failed (401): bad_credentials',
    )
  })
})
