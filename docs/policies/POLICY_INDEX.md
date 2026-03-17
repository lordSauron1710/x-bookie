# Security Policy Index

This file is the entrypoint for the repository policy set.

## Precedence

- [AGENTS.md](../../AGENTS.md) is the primary repo instruction file.
- These policy docs are supplemental guardrails.
- They must not override the product goal, UI direction, or deployability requirements unless a direct security issue requires a safer implementation.
- When there is tension, preserve the product goal and solve it securely.

## Current Repo Posture

- Vite + React frontend
- Express backend for X OAuth, sessions, and bookmark sync
- X-only authentication model
- Signed server-side cookie sessions
- In-memory server store for sessions and synced bookmarks
- Browser `localStorage` only for per-account interests and overrides
- Draft Postgres schema present in `db/schema.sql`, but no durable database is active yet
- Environment variables are required for X auth and production deployment

## Read These For Every Change

- [AGENTS.md](../../AGENTS.md)
- [SECURITY.md](./SECURITY.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Read These When Introducing New Surface Area

- [AUTH.md](./AUTH.md)
  - Before changing login, sessions, cookies, or account linking
- [API.md](./API.md)
  - Before adding or changing network-facing handlers
- [DATABASE.md](./DATABASE.md)
  - Before replacing the in-memory store with durable persistence
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
  - When handling a security incident or suspected credential exposure

## Baseline Workflow

1. Identify whether the change alters auth, API, env vars, deployment, or persistence.
2. Update the relevant policy doc in the same PR.
3. Keep `README.md` and setup docs in sync.
4. Run the relevant verification for the change, including security checks when the surface area expands.
