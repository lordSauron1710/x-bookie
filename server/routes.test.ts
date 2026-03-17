process.env.APP_ORIGIN ??= 'http://localhost:5173'
process.env.API_ORIGIN ??= 'http://localhost:8787'
process.env.SESSION_COOKIE_SECRET ??= 'test-session-cookie-secret'

import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { app } from './index.js'

describe('server routes', () => {
  test('GET /api/session responds even when no cookie is set', async () => {
    const response = await request(app).get('/api/session')
    expect(response.status).toBe(200)
    expect(response.body.authenticated).toBe(false)
    expect(response.body.xAuthConfigured).toBeDefined()
  })

  test('GET /api/bookmarks requires authentication', async () => {
    await request(app)
      .get('/api/bookmarks')
      .expect(401)
      .expect((response) => {
        expect(response.body.error?.code).toBe('unauthorized')
      })
  })

  test('POST /api/bookmarks/sync requires authentication', async () => {
    await request(app)
      .post('/api/bookmarks/sync')
      .expect(401)
      .expect((response) => {
        expect(response.body.error?.message).toMatch(/Sign in with X/)
      })
  })
})
