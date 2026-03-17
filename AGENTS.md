# Agent Instructions - x-bookie

Primary instruction file for AI agents working in this repository.

## End Goal

Build a deployable bookmark intelligence app that helps users import Twitter/X bookmarks, analyze them against their interests, and organize them through a fast, intuitive interface.

Prioritize:

- intuitive UX
- maintainable frontend architecture
- secure-by-default expansion paths for auth, sync, and backend features

## Mindset

- Think like a senior developer.
- Prefer explicit, readable solutions over clever ones.
- Preserve current behavior unless the task changes it intentionally.
- Treat this as a real product, not a prototype that can ignore auth, privacy, or deployment constraints.
- Keep the app shippable: no hardcoded secrets, no fake trust boundaries, and no architecture that blocks future auth or API work.

## Current Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| App | Vite + React | Single-page frontend today |
| Language | TypeScript | Keep types explicit; avoid `any` without justification |
| Styling | CSS + component-level UI structure | Match the established UI direction unless a task changes it |
| State | React state + localStorage | Current app is local-first |
| Data | Imported JSON / CSV / pasted text | No live X integration yet |

If the stack changes materially, update this file and `README.md`.

## Product Rules

- Keep the core flow obvious: import, define interests, review categories, inspect insights.
- Local-first is the current baseline. Do not introduce auth, backend APIs, or persistence casually.
- Bookmark data is user content. Treat it as untrusted input and render it safely.
- Keep the UI responsive and accessible across desktop and mobile layouts.

## Engineering Rules

- Prefer typed helper functions for parsing, scoring, and transformations.
- Keep business logic out of the UI when possible.
- Avoid hidden coupling between local storage, UI state, and future server features.
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

- [AUTH.md](./docs/policies/AUTH.md) before adding login, sessions, protected routes, or roles
- [API.md](./docs/policies/API.md) before adding any network-facing handler or backend service
- [DATABASE.md](./docs/policies/DATABASE.md) before adding persistence or synced user data
- [INCIDENT_RESPONSE.md](./docs/policies/INCIDENT_RESPONSE.md) when handling a suspected security event

Required follow-through:

- If a change adds auth, APIs, persistence, env vars, or deployment behavior, update the relevant policy docs in the same PR.
- Keep `README.md` in sync with setup, deployment, and trust-boundary changes.
- When dependencies change in security-sensitive work, run `npm audit` and document accepted risk.

## Key Files

| File | Purpose |
| --- | --- |
| [README.md](./README.md) | Product overview and run instructions |
| [src/App.tsx](./src/App.tsx) | Main application shell and current UX |
| [src/lib/bookmarks.ts](./src/lib/bookmarks.ts) | Parsing, scoring, and categorization logic |
| [POLICY_INDEX.md](./docs/policies/POLICY_INDEX.md) | Entry point for the policy set |
| [SECURITY.md](./docs/policies/SECURITY.md) | Repo-wide security baseline |
| [AUTH.md](./docs/policies/AUTH.md) | Rules for future auth and authorization work |
| [API.md](./docs/policies/API.md) | Rules for future APIs or backend handlers |
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

- Goal: intuitive bookmark intelligence app
- Baseline: local-first Vite + React app
- Future risk areas: auth, APIs, synced storage, env vars, deployment
- Policy docs: supplemental guardrails that must evolve with the codebase
