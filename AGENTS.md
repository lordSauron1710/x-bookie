# Agent Instructions - x-bookie

Primary instruction file for AI agents working in this repository.

## End Goal

Build a deployable X-only bookmark intelligence app that lets users connect their X account, sync bookmarks, analyze them against their interests, and organize them through a fast, intuitive interface.

Prioritize:

- intuitive UX
- maintainable frontend and backend architecture
- secure-by-default auth, sync, and future persistence paths

## Mindset

- Think like a senior developer.
- Prefer explicit, readable solutions over clever ones.
- Preserve current behavior unless the task changes it intentionally.
- Treat this as a real product, not a prototype that can ignore auth, privacy, or deployment constraints.
- Keep the app shippable: no hardcoded secrets, no fake trust boundaries, and no architecture that blocks future durable storage or production auth hardening.

## Current Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | Vite + React | Main SPA and bookmark review UX |
| Backend | Express | X OAuth, session endpoints, bookmark sync routes |
| Language | TypeScript | Keep types explicit; avoid `any` without justification |
| Styling | CSS + component-level UI structure | Match the established UI direction unless a task changes it |
| State | React state + localStorage + server session | Local storage is for per-account interests/overrides only |
| Data | Live X bookmarks via OAuth | Backend cache is in-memory today; durable DB is the next step |

If the stack changes materially, update this file and `README.md`.

## Product Rules

- Keep the core flow obvious: connect X, sync bookmarks, refine interests, review categories, inspect insights.
- X is the only auth and data provider for now. Do not add generic multi-provider abstractions unless the task requires it.
- Bookmark data is user content. Treat it as untrusted input and render it safely.
- Keep the UI responsive and accessible across desktop and mobile layouts.
- Store X tokens server-side only.
- Treat local storage as a convenience layer for client-side preferences, not as an auth or token store.

## Engineering Rules

- Prefer typed helper functions for parsing, scoring, X normalization, and transformations.
- Keep business logic out of the UI when possible.
- Keep frontend bookmark analysis decoupled from the transport layer so local demo data, synced X data, and future DB reads use the same analysis path.
- Use Codex skills when the task requires them.
  - If a request matches a Codex skill workflow or an applicable skill is explicitly required, follow that skill instead of improvising an ad hoc process.
  - Treat skill-driven workflows as formal execution requirements for that class of task, especially for security-sensitive, deployment-sensitive, or tool-specific work.
- Do not invent security boundaries in the client.
  - Hidden UI, localStorage flags, or client-only checks are not authorization.

## Security Policy Workflow

`AGENTS.md` is the primary repo instruction file. The policy docs below are supplemental and must be followed in ways that preserve the product goal and current architecture.

Read for every change:

- [POLICY_INDEX.md](./docs/policies/POLICY_INDEX.md)
- [SECURITY.md](./docs/policies/SECURITY.md)
- [ACCESSIBILITY.md](./docs/policies/ACCESSIBILITY.md)
- [ENV_VARIABLES.md](./docs/policies/ENV_VARIABLES.md)
- [DEPLOYMENT.md](./docs/policies/DEPLOYMENT.md)

Read when introducing new surface area:

- [AUTH.md](./docs/policies/AUTH.md) before changing login, sessions, cookies, or account linking
- [API.md](./docs/policies/API.md) before adding or changing network-facing handlers
- [DATABASE.md](./docs/policies/DATABASE.md) before adding durable persistence or synced user data
- [INCIDENT_RESPONSE.md](./docs/policies/INCIDENT_RESPONSE.md) when handling a suspected security event

Required follow-through:

- If a change adds or changes auth, APIs, persistence, env vars, or deployment behavior, update the relevant policy docs in the same PR.
- Keep `README.md` in sync with setup, deployment, and trust-boundary changes.
- When dependencies change in security-sensitive work, run `npm audit` and document accepted risk.

## Key Files

| File | Purpose |
| --- | --- |
| [README.md](./README.md) | Product overview and run instructions |
| [src/App.tsx](./src/App.tsx) | Main application shell and current UX |
| [src/lib/bookmarks.ts](./src/lib/bookmarks.ts) | Scoring and categorization logic |
| [src/hooks/useBookmarkSource.ts](./src/hooks/useBookmarkSource.ts) | Frontend X session and bookmark source logic |
| [src/hooks/useInterestProfile.ts](./src/hooks/useInterestProfile.ts) | Per-account interest and override persistence |
| [server/index.ts](./server/index.ts) | Express server entrypoint and X-facing API routes |
| [server/lib/xOAuth.ts](./server/lib/xOAuth.ts) | X OAuth 2.0 PKCE exchange logic |
| [server/lib/xClient.ts](./server/lib/xClient.ts) | X API client and bookmark fetch logic |
| [server/store/memoryStore.ts](./server/store/memoryStore.ts) | Current in-memory session/bookmark store |
| [shared/contracts.ts](./shared/contracts.ts) | Shared client/server API contracts |
| [db/schema.sql](./db/schema.sql) | Planned durable Postgres schema for the next phase |
| [POLICY_INDEX.md](./docs/policies/POLICY_INDEX.md) | Entry point for the policy set |
| [SECURITY.md](./docs/policies/SECURITY.md) | Repo-wide security baseline |
| [AUTH.md](./docs/policies/AUTH.md) | Rules for auth, sessions, and authorization |
| [API.md](./docs/policies/API.md) | Rules for backend handlers |
| [DATABASE.md](./docs/policies/DATABASE.md) | Rules for future persistence and synced user data |
| [ENV_VARIABLES.md](./docs/policies/ENV_VARIABLES.md) | Rules for env var handling |
| [DEPLOYMENT.md](./docs/policies/DEPLOYMENT.md) | Deployment baseline |
| [INCIDENT_RESPONSE.md](./docs/policies/INCIDENT_RESPONSE.md) | Security incident workflow |
| [errors.md](./docs/reference/errors.md) | Lessons learned from bugs and production mistakes |

## Errors And Learning

- Check [errors.md](./docs/reference/errors.md) when you hit a recurring issue.
- When you fix a bug that should influence future work, add a short entry with:
  - symptom
  - root cause
  - fix
  - lesson

## Summary

- Goal: X-only bookmark intelligence app
- Baseline: Vite + React frontend with an Express backend for X auth and bookmark sync
- Current caveat: sessions and synced bookmarks are in-memory today, so durable DB work is still needed
- Future risk areas: durable token storage, production deployment, rate limits, and synced user data
- Policy docs: supplemental guardrails that must evolve with the codebase
