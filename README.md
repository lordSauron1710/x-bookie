# x-bookie

X-only bookmark intelligence app for connecting an X account, syncing bookmarks, scoring them against user interests, and reviewing them through a three-column analysis interface.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)
[![Security Policies](https://img.shields.io/badge/Policies-enabled-black)](./docs/policies/POLICY_INDEX.md)

## What it does

- Connects an X account with OAuth 2.0 PKCE.
- Syncs bookmarks from X into the app backend.
- Scores bookmarks against user-defined interests.
- Suggests categories, confidence, action lanes, and short explanations for each bookmark.
- Stores per-account interests and manual overrides in the browser.

## Current architecture

```text
Vite React app
  -> App shell (taxonomy / bookmarks / insights)
  -> Shared bookmark analysis engine
  -> API client for X session + bookmark sync

Express server
  -> X OAuth start/callback routes
  -> Signed cookie session endpoints
  -> Bookmark sync endpoint
  -> Pluggable store (memory by default, Postgres when configured)

Planned next step
  -> Frontend decomposition and model-backed bookmark classification
```

## Current runtime posture

| Area | Current behavior |
| --- | --- |
| Auth | X-only OAuth 2.0 PKCE via backend |
| Sessions | Signed `HttpOnly` cookie |
| Bookmark sync | Live X fetch through backend |
| Bookmark persistence | In-memory by default, Postgres when `DATABASE_URL` is configured |
| Interest profile | Browser `localStorage`, scoped by X user id |
| Database | Optional Postgres runtime with schema auto-init from `db/schema.sql` |

## Repository layout

```text
x-bookie/
├── db/
│   └── schema.sql
├── public/
├── server/
│   ├── lib/
│   ├── store/
│   ├── config.ts
│   └── index.ts
├── shared/
│   └── contracts.ts
├── src/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── docs/
│   ├── policies/
│   └── reference/
├── AGENTS.md
├── .env.example
├── package.json
├── tsconfig.server.json
└── vite.config.ts
```

## Prerequisites

- Node.js 20+
- npm 10+
- X developer app credentials for live auth/sync
- Postgres 15+ if you want durable server storage

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create env vars:

```bash
cp .env.example .env
```

3. Fill in the X settings in `.env`.

If you want durable sessions, encrypted token storage, and persisted synced bookmarks, also set:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/x_bookie
TOKEN_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

You can generate the encryption key with:

```bash
openssl rand -base64 32
```

For local development, register this callback URL in your X app settings:

```text
http://localhost:8787/api/auth/x/callback
```

4. Start the client and server together:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8787`

The Vite dev server proxies `/api/*` requests to the backend by default.

## Production build

```bash
npm run build
npm test
npm run start
```

`npm run start` serves the compiled Express server from `dist/server/server/index.js`.

## Testing

```bash
npm test
npm run test:coverage
```

- `npm test` runs the full Vitest suite across frontend and backend modules.
- `npm run test:coverage` generates text and HTML coverage reports.
- GitHub Actions runs lint, build, and coverage-backed tests on pushes to `main` and on pull requests.

## Environment variables

See [.env.example](./.env.example) and [ENV_VARIABLES.md](./docs/policies/ENV_VARIABLES.md).

Important ones:

- `SESSION_COOKIE_SECRET`
- `DATABASE_URL` for durable server storage
- `TOKEN_ENCRYPTION_KEY` for encrypting X tokens at rest when Postgres is enabled
- `X_CLIENT_ID`
- `X_CLIENT_SECRET` when your X app type requires it
- `APP_ORIGIN`
- `API_ORIGIN`

## Current API surface

- `GET /api/health`
  - Returns `ok` plus the active store mode (`memory` or `postgres`)
- `GET /api/session`
- `GET /api/bookmarks`
- `POST /api/bookmarks/sync`
- `GET /api/auth/x/start`
- `GET /api/auth/x/callback`
- `POST /api/auth/logout`

## Security baseline

- X tokens stay server-side.
- If Postgres is enabled, X tokens are encrypted before storage.
- Browser code should never receive X provider secrets.
- Sessions use signed `HttpOnly` cookies.
- Durable persistence is opt-in through `DATABASE_URL`; otherwise the backend falls back to memory.

## Project status

- Current state: X-only full-stack MVP with live auth routes, bookmark sync routes, a shared analysis UI, optional Postgres-backed persistence, and per-account local interest profiles.
- Current limitation: bookmark analysis is still heuristic, and frontend UI logic is still concentrated in large files even though the automated test baseline now covers the main hooks, app shell flows, and backend auth/sync primitives.
- Next milestone: decompose the UI and introduce a model-backed classifier behind the existing analysis contract.

## Documentation map

- `AGENTS.md`: primary repo instructions for architecture, product direction, and policy workflow.
- `docs/policies/POLICY_INDEX.md`: entrypoint to the repo policy set.
- `docs/policies/SECURITY.md`: repo-wide security baseline and required checks.
- `docs/policies/AUTH.md`: requirements for auth, sessions, and authorization.
- `docs/policies/API.md`: requirements for backend handlers.
- `docs/policies/DATABASE.md`: requirements for future durable persistence.
- `docs/policies/ENV_VARIABLES.md`: rules for introducing and documenting env vars safely.
- `docs/policies/DEPLOYMENT.md`: deployment posture and production rollout expectations.
- `docs/policies/ACCESSIBILITY.md`: accessibility requirements for the review UI.
- `docs/policies/INCIDENT_RESPONSE.md`: containment and recovery workflow for security incidents.
- `docs/reference/errors.md`: lessons learned from bugs, bad assumptions, and security mistakes.

## License

License file has not been added yet.
