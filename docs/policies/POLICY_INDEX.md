# Security Policy Index

This file is the entrypoint for the repository policy set.

## Precedence

- [AGENTS.md](../../AGENTS.md) is the primary repo instruction file.
- These policy docs are supplemental guardrails.
- They must not override the product goal, UI direction, or deployability requirements unless a direct security issue requires a safer implementation.
- When there is tension, preserve the product goal and solve it securely.

## Current Repo Posture

- Vite + React single-page app
- Local-first bookmark analysis in the browser
- No authentication
- No backend API
- No database
- No required environment variables
- Local storage is used for convenience only, not trust

## Read These For Every Change

- [AGENTS.md](../../AGENTS.md)
- [SECURITY.md](./SECURITY.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Read These When Introducing New Surface Area

- [AUTH.md](./AUTH.md)
  - Before adding login, sessions, protected routes, account linking, or roles
- [API.md](./API.md)
  - Before adding network-facing handlers, server functions, or proxy endpoints
- [DATABASE.md](./DATABASE.md)
  - Before adding persistence, synced bookmarks, or user profiles
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
  - When handling a security incident or suspected credential exposure

## Baseline Workflow

1. Identify whether the change adds a new trust boundary.
2. Update the relevant policy doc in the same PR.
3. Keep `README.md` and any setup documentation in sync.
4. Run the relevant verification for the change, including security checks when the surface area expands.
