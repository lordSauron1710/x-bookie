# Authentication And Authorization Policy

There is no authentication or authorization layer in this repository today.

That is the current design, not a shortcut.

Do not introduce hidden admin behavior, client-side role checks, or token-based access without adding a real server-side trust boundary.

## Current State

- No login or signup flow
- No sessions
- No roles or permission model
- No protected routes
- No backend authorization checks

## If Authentication Is Added

- All authentication checks must be enforced server-side.
  - Client state may control UI, but it must not be treated as authorization.
- Prefer `HttpOnly`, `Secure`, `SameSite=Lax` or `SameSite=Strict` cookies for sessions.
- Never store long-lived auth tokens in `localStorage`, `sessionStorage`, or query parameters.
- Access tokens must be short-lived.
- Refresh tokens must rotate and be invalidated on reuse.
- State-changing auth endpoints must include brute-force protection and CSRF defenses where applicable.
- Passwords must be hashed with Argon2, scrypt, or bcrypt.
- Any privileged behavior must be backed by server-side role verification.

## Authorization Rules

- Apply least privilege by default.
- Separate anonymous, authenticated, and administrative capabilities clearly.
- Ownership checks must happen server-side for any user-scoped resource.
- Do not rely on hidden buttons or disabled controls as security.

## Required Changes In The Same PR

If auth is added, update all of the following together:

- [SECURITY.md](./SECURITY.md)
- [API.md](./API.md)
- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- `README.md`

If auth also introduces synced user data, update [DATABASE.md](./DATABASE.md) too.

## Pre-Merge Checklist For Auth Work

- [ ] Server-side session or token verification exists
- [ ] Protected routes or endpoints return 401 / 403 correctly
- [ ] No tokens are exposed in client bundles, URLs, or logs
- [ ] Login and recovery flows are rate limited
- [ ] Logout and session invalidation behavior are defined
- [ ] Any roles are documented and enforced server-side
