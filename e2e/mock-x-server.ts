import express from 'express'

type MockBookmark = {
  id: string
  text: string
  authorId: string
  createdAt: string
}

const port = Number(process.env.PORT ?? 9191)
const viewer = {
  id: 'u-e2e-1',
  name: 'Playwright User',
  username: 'playwright_user',
  profile_image_url: 'https://example.com/avatar.png',
}

const authors = new Map([
  [
    viewer.id,
    {
      id: viewer.id,
      name: viewer.name,
      username: viewer.username,
    },
  ],
  [
    'u-ai-2',
    {
      id: 'u-ai-2',
      name: 'Agent Notes',
      username: 'agentnotes',
    },
  ],
])

function buildDefaultBookmarks(): MockBookmark[] {
  return [
    {
      id: 'tweet-101',
      text: 'Shipping a new AI workflow with better prompt evaluation and launch notes.',
      authorId: viewer.id,
      createdAt: '2026-02-01T12:00:00.000Z',
    },
    {
      id: 'tweet-102',
      text: 'Market multiple compression is changing how I think about software durability.',
      authorId: 'u-ai-2',
      createdAt: '2026-02-02T12:00:00.000Z',
    },
    {
      id: 'tweet-103',
      text: 'A clean onboarding checklist is still the fastest way to improve activation.',
      authorId: viewer.id,
      createdAt: '2026-02-03T12:00:00.000Z',
    },
  ]
}

let bookmarks = buildDefaultBookmarks()

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/health', (_request, response) => {
  response.json({ ok: true })
})

app.post('/__admin/reset', (_request, response) => {
  bookmarks = buildDefaultBookmarks()
  response.json({ ok: true })
})

app.post('/__admin/scenario', (request, response) => {
  bookmarks = Array.isArray(request.body?.bookmarks) ? request.body.bookmarks : buildDefaultBookmarks()
  response.json({ ok: true, count: bookmarks.length })
})

app.get('/i/oauth2/authorize', (request, response) => {
  const redirectUri = request.query.redirect_uri
  const state = request.query.state

  if (typeof redirectUri !== 'string' || typeof state !== 'string') {
    response.status(400).json({ error: 'missing redirect_uri or state' })
    return
  }

  const next = new URL(redirectUri)
  next.searchParams.set('code', 'mock-auth-code')
  next.searchParams.set('state', state)
  response.redirect(next.toString())
})

app.post('/2/oauth2/token', (_request, response) => {
  response.json({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    scope: 'bookmark.read tweet.read users.read offline.access',
  })
})

app.get('/2/users/me', (_request, response) => {
  response.json({
    data: viewer,
  })
})

app.get('/2/users/:userId/bookmarks', (request, response) => {
  const userId = request.params.userId

  if (userId !== viewer.id) {
    response.status(404).json({ error: 'unknown user' })
    return
  }

  response.json({
    data: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      text: bookmark.text,
      author_id: bookmark.authorId,
      created_at: bookmark.createdAt,
    })),
    includes: {
      users: Array.from(
        new Set(bookmarks.map((bookmark) => bookmark.authorId)),
      )
        .map((authorId) => authors.get(authorId))
        .filter(Boolean),
    },
    meta: {},
  })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`mock X listening on http://127.0.0.1:${port}`)
})
