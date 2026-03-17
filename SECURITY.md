# Security Policy

SignalShelf is currently a client-heavy React app that imports bookmark data locally and stores user state in the browser. The main risks today are unsafe future auth patterns, accidental secret exposure, client-side injection, unsafe backend additions, and over-trusting browser state.

Treat security requirements as non-optional.

## Scope And Precedence

- This file supplements [AGENTS.md](./AGENTS.md); it does not replace it.
- These rules should reinforce the product goal: a polished bookmark analysis app with a simple, intuitive workflow.
- Do not use this policy set to justify generic enterprise boilerplate that fights the current product shape.
- If a security control affects UX, implement the safest version that still fits the repo's architecture and document the tradeoff.

## Current Security Posture

- Bookmark parsing and categorization run in the browser.
- There is no trusted backend in this repository today.
- There is no auth layer, no API surface, and no database.
- Local storage is a convenience layer only. It is not a secure store and not a trust boundary.

## Core Rules

- Never commit secrets.
  - No API keys, tokens, session material, private URLs with credentials, or `.env*` files in git.
- Treat all browser-delivered code as public.
  - Any value exposed to client code must be safe to expose.
- Do not add unsafe browser sinks.
  - No `dangerouslySetInnerHTML` with untrusted content.
  - No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, or string-based timers for untrusted input.
- Do not widen the attack surface casually.
  - New auth, API, database, third-party scripts, analytics, or external embeds require policy updates in the same PR.
- Prefer typed data and React rendering over manual DOM mutation.
- Keep dependencies minimal and reviewable.

## Security Requirements For New Features

- Any new auth or session work must follow [AUTH.md](./AUTH.md).
- Any new backend or network-facing surface must follow [API.md](./API.md).
- Any new synced storage or persistence layer must follow [DATABASE.md](./DATABASE.md).
- Any new environment variable must be documented in [ENV_VARIABLES.md](./ENV_VARIABLES.md) and `README.md`.
- Any deployment behavior change must be documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Browser And Deployment Baseline

- Prefer security headers when deployment config is introduced or changed:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - clickjacking protection via `X-Frame-Options` or CSP `frame-ancestors`
  - restrictive `Permissions-Policy` for unused browser features
- Do not load third-party scripts unless the product requires them and the data exposure is understood.
- Do not expose debug behavior or stack traces in production-facing surfaces.

## Required Checks Before Merge

- Review the diff for secrets, unsafe logs, and accidental credential exposure.
- Run `npm run build`.
- Run `npm run lint`.
- If dependencies changed, run `npm audit`.
- If a security-sensitive surface changed, update the relevant policy docs in the same PR.

## Reporting A Vulnerability

- Do not open a public issue for an unpatched security vulnerability.
- Report privately first.
- Include reproduction steps, impacted files, and a short impact summary.
- After remediation, document the lesson in [errors.md](./errors.md) when it should change future practice.
