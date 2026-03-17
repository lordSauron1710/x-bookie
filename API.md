# API Policy

This repository does not currently expose any backend API or server-side business-logic surface.

If you add one, it becomes security-critical immediately.

## Current State

- No API routes in this repo
- No server actions
- No authenticated backend endpoints
- No external write APIs

## Rules For Any New Endpoint

- Validate all input at runtime.
  - Validate body, query params, path params, and headers as needed.
  - Prefer a schema library such as Zod.
- Authenticate before business logic when the endpoint is not fully public.
- Authorize separately from authentication.
- Rate limit public or state-changing routes.
- Return safe error messages.
  - Do not leak stack traces, file paths, provider internals, or secret-bearing details.
- Restrict methods explicitly.
- Keep CORS narrow.
- Set request size expectations.
- Make write operations idempotent where practical.

## Additional Rules For This Repo

- Do not create backend endpoints just to avoid straightforward client-state work.
- Document every new endpoint in `README.md`.
- Update [AUTH.md](./AUTH.md) if the endpoint introduces sessions, users, roles, or privileged behavior.
- Update [ENV_VARIABLES.md](./ENV_VARIABLES.md) if the endpoint requires secrets or external services.
- Update [DATABASE.md](./DATABASE.md) if the endpoint introduces persistent data.

## Pre-Merge Checklist For API Work

- [ ] Runtime validation is enforced
- [ ] Methods are restricted explicitly
- [ ] Public or write routes are rate limited
- [ ] Error responses do not reveal internals
- [ ] Auth and authorization behavior is documented when applicable
- [ ] Required env vars and deployment assumptions are documented
