# Authentication And Authorization Policy

x-bookie currently uses X as its only identity provider.

Authentication is handled server-side through OAuth 2.0 PKCE and a signed `HttpOnly` session cookie.

## Current State

- X-only login
- No email/password flow
- No roles or permission model
- No client-side authorization boundary
- Session storage is memory-backed by default and can move to Postgres when configured

## Current Rules

- All authentication checks must be enforced server-side.
- Client state may control UI, but it must not be treated as authorization.
- Use signed `HttpOnly`, `Secure` cookies in production.
- Never store long-lived auth tokens or provider tokens in browser storage.
- X provider tokens must remain server-side.
- If provider tokens are stored durably, encrypt them at rest.
- Any future privileged behavior must be backed by server-side verification.

## If Authentication Is Expanded

- Access tokens must be short-lived.
- Refresh tokens must rotate and be invalidated on reuse where the provider supports it.
- State-changing auth endpoints must include brute-force protection and CSRF defenses where applicable.
- If you add roles, document them and enforce them server-side.
- If you move session storage or token storage into a database, update [DATABASE.md](./DATABASE.md) in the same PR.

## Required Changes In The Same PR

If auth behavior changes, update all of the following together:

- [SECURITY.md](./SECURITY.md)
- [API.md](./API.md)
- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- `README.md`

If auth also introduces durable persistence, update [DATABASE.md](./DATABASE.md) too.

## Pre-Merge Checklist For Auth Work

- [ ] Server-side session verification exists
- [ ] No provider tokens are exposed in client bundles, URLs, or logs
- [ ] Cookies are `HttpOnly` and production-safe
- [ ] Auth start/callback behavior is documented
- [ ] Logout behavior is defined
