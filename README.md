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
  -> In-memory session/bookmark store

Planned next step
  -> Durable Postgres-backed session/token/bookmark storage
```

## Current runtime posture

| Area | Current behavior |
| --- | --- |
| Auth | X-only OAuth 2.0 PKCE via backend |
| Sessions | Signed `HttpOnly` cookie |
| Bookmark sync | Live X fetch through backend |
| Bookmark persistence | In-memory server store only |
| Interest profile | Browser `localStorage`, scoped by X user id |
| Database | Not active yet; draft schema lives in `db/schema.sql` |

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
npm run start
```

`npm run start` serves the compiled Express server from `dist/server/server/index.js`.

## Environment variables

See [.env.example](./.env.example) and [ENV_VARIABLES.md](./docs/policies/ENV_VARIABLES.md).

Important ones:

- `SESSION_COOKIE_SECRET`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET` when your X app type requires it
- `APP_ORIGIN`
- `API_ORIGIN`

## Current API surface

- `GET /api/health`
- `GET /api/session`
- `GET /api/bookmarks`
- `POST /api/bookmarks/sync`
- `GET /api/auth/x/start`
- `GET /api/auth/x/callback`
- `POST /api/auth/logout`

## Security baseline

- X tokens stay server-side.
- Browser code should never receive X provider secrets.
- Sessions use signed `HttpOnly` cookies.
- The current backend store is in-memory and not durable.
- If this repo adds durable persistence, move tokens, sessions, and synced bookmarks into a real database and update the policy docs in the same change.

## Project status

- Current state: X-only full-stack scaffold with live auth routes, bookmark sync routes, a shared analysis UI, and per-account local interest profiles.
- Current limitation: backend sessions and synced bookmarks are in-memory, so restarts clear server-side data.
- Next milestone: replace the in-memory store with Postgres using [`db/schema.sql`](./db/schema.sql).

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
