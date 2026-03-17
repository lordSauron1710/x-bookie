# Deployment Policy

x-bookie now ships as a frontend plus backend application.

## Current Deployment Shape

- Frontend: Vite + React
- Backend: Express
- Standard build command: `npm run build`
- Standard test command: `npm test`
- Standard start command: `npm run start`
- Runtime posture: X-only auth and bookmark sync, with memory storage by default and optional Postgres-backed persistence
- Optional model-backed bookmark classification via server-side OpenAI calls

## Deployment Rules

- Production deployments must use the production build output.
- Deploy the backend and frontend so cookie-based auth works correctly.
  - Same-origin deployment is preferred when possible.
- Production deployments should set `DATABASE_URL` and `TOKEN_ENCRYPTION_KEY` so sessions, tokens, and synced bookmarks survive restarts.
- Production deployments that want model-backed classification must set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`.
- Any future durable backend component must document its hosting assumptions clearly.
- Any new environment variable must be documented in [ENV_VARIABLES.md](./ENV_VARIABLES.md) and `README.md`.
- Preview deployments must not silently point at privileged production X apps.
- Cookie-authenticated POST routes now enforce same-origin `Origin` checks, so production hosting must preserve a stable public app origin.

## Security Baseline For Deployments

- Serve security headers in production:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - clickjacking protection via `X-Frame-Options` or CSP `frame-ancestors`
  - restrictive `Permissions-Policy` for unused browser features
- Do not expose stack traces or debug mode in production.
- Keep source maps private or intentionally managed if they are published.
- Use production-safe cookie settings.
- Ensure reverse proxies preserve the public origin expected by `APP_ORIGIN` and `API_ORIGIN`.

## Required Validation Before Release

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm audit`
- [ ] `README.md` reflects deploy and config changes
- [ ] External services and secrets are documented
- [ ] Run `npm run test:e2e` for browser-level login/sync/logout coverage when release-critical flows change
