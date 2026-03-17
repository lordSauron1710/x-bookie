# Security Policy

x-bookie is now a full-stack X-only application. The main risks are OAuth misconfiguration, token exposure, insecure session handling, unsafe future persistence, client-side injection, and over-trusting browser state.

Treat security requirements as non-optional.

## Scope And Precedence

- This file supplements [AGENTS.md](../../AGENTS.md); it does not replace it.
- These rules should reinforce the product goal: a polished X bookmark analysis app with a simple, intuitive workflow.
- Do not use this policy set to justify generic enterprise boilerplate that fights the current product shape.
- If a security control affects UX, implement the safest version that still fits the repo's architecture and document the tradeoff.

## Current Security Posture

- Bookmark analysis still runs in the browser.
- X auth and bookmark sync happen through the Express backend.
- Sessions use signed `HttpOnly` cookies.
- X provider tokens stay server-side and are encrypted at rest when Postgres storage is enabled.
- Durable persistence is optional; without database configuration the backend still falls back to memory.
- Browser `localStorage` is used only for interest profiles and overrides, not for auth or provider tokens.

## Core Rules

- Never commit secrets.
  - No API keys, client secrets, tokens, session material, private URLs with credentials, or `.env*` files in git.
- Treat all browser-delivered code as public.
  - Any value exposed to client code must be safe to expose.
- Do not store X provider tokens in `localStorage`, `sessionStorage`, or query parameters.
- Do not add unsafe browser sinks.
  - No `dangerouslySetInnerHTML` with untrusted content.
  - No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, or string-based timers for untrusted input.
- Keep auth and sync logic server-side.
- Rate limit auth start and bookmark sync routes.
- Require `TOKEN_ENCRYPTION_KEY` whenever provider tokens are stored in Postgres.
- Prefer typed data and React rendering over manual DOM mutation.
- Keep dependencies minimal and reviewable.

## Security Requirements For New Features

- Auth and session changes must follow [AUTH.md](./AUTH.md).
- Backend or handler changes must follow [API.md](./API.md).
- Durable persistence must follow [DATABASE.md](./DATABASE.md).
- New environment variables must be documented in [ENV_VARIABLES.md](./ENV_VARIABLES.md) and `README.md`.
- Deployment behavior changes must be documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Browser And Deployment Baseline

- Serve security headers in production:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - clickjacking protection via `X-Frame-Options` or CSP `frame-ancestors`
  - restrictive `Permissions-Policy` for unused browser features
- Do not load third-party scripts unless the product requires them and the data exposure is understood.
- Do not expose debug behavior or stack traces in production-facing responses.

## Required Checks Before Merge

- Review the diff for secrets, unsafe logs, and accidental credential exposure.
- Run `npm run build`.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm audit` when dependencies change.
- If a security-sensitive surface changed, update the relevant policy docs in the same PR.

## Reporting A Vulnerability

- Do not open a public issue for an unpatched security vulnerability.
- Report privately first.
- Include reproduction steps, impacted files, and a short impact summary.
- After remediation, document the lesson in [errors.md](../reference/errors.md) when it should change future practice.
