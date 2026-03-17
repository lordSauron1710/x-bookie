# API Policy

x-bookie now exposes a backend API and X auth handler surface.

That surface is security-critical.

## Current State

- `GET /api/health`
- `GET /api/session`
- `GET /api/bookmarks`
- `POST /api/bookmarks/sync`
- `GET /api/auth/x/start`
- `GET /api/auth/x/callback`
- `POST /api/auth/logout`

## Rules For Any Endpoint

- Validate all input at runtime.
  - Validate body, query params, path params, and headers as needed.
  - Prefer a schema library such as Zod.
- Authenticate before business logic when the endpoint is not fully public.
- Authorize separately from authentication when capabilities diverge later.
- Rate limit public or state-changing routes.
- Return safe error messages.
  - Do not leak stack traces, provider internals, or secret-bearing details.
- Restrict methods explicitly.
- Keep CORS narrow.
- Set request size expectations.

## Additional Rules For This Repo

- Keep X provider calls behind the server.
- Do not add endpoints that expose X tokens or raw session internals to the browser.
- Document every new endpoint in `README.md`.
- Update [AUTH.md](./AUTH.md) if the endpoint changes session or auth behavior.
- Update [ENV_VARIABLES.md](./ENV_VARIABLES.md) if the endpoint requires new secrets or config.
- Update [DATABASE.md](./DATABASE.md) if the endpoint introduces durable persistence.

## Pre-Merge Checklist For API Work

- [ ] Runtime validation is enforced where input is accepted
- [ ] Methods are restricted explicitly
- [ ] Public or write routes are rate limited
- [ ] Error responses do not reveal internals
- [ ] Auth behavior is documented
- [ ] Required env vars and deployment assumptions are documented
