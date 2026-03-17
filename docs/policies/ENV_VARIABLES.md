# Environment Variables Policy

x-bookie now requires environment variables for backend auth and deployment.

## Current Inventory

| Variable | Required | Scope | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | server | Express port, defaults to `8787` |
| `APP_ORIGIN` | yes for real deploys | server | Browser origin used for redirects |
| `API_ORIGIN` | yes for real deploys | server | Public backend origin |
| `SESSION_COOKIE_SECRET` | yes | server | Cookie signing secret |
| `DATABASE_URL` | no | server | Enables Postgres-backed session/token/bookmark storage |
| `DATABASE_SSL` | no | server | Enables TLS for the Postgres client connection |
| `TOKEN_ENCRYPTION_KEY` | yes when `DATABASE_URL` is set | server | Base64-encoded 32-byte key for encrypting X tokens at rest |
| `X_CLIENT_ID` | yes for X auth | server | X OAuth client id |
| `X_CLIENT_SECRET` | depends on X app type | server | X OAuth client secret |
| `X_REDIRECT_URI` | no | server | Override callback URL |
| `X_SCOPES` | no | server | Override requested X scopes |
| `X_AUTHORIZE_URL` | no | server | Override X authorize URL |
| `X_API_BASE_URL` | no | server | Override X API base URL |
| `VITE_API_ORIGIN` | no | client | Public API origin when not using same-origin/proxy routing |
| `VITE_API_PROXY_TARGET` | no | build/dev | Dev proxy target for Vite |

## Rules For Adding Variables

- Document every new variable in `README.md`.
- Any `VITE_*` value is public by definition and must be safe to expose.
- Keep secrets server-only.
- `TOKEN_ENCRYPTION_KEY` must be a base64-encoded 32-byte value.
- Do not hardcode API URLs, tokens, client secrets, or environment-specific IDs in source files.
- Remove unused variables when the code that depends on them is removed.

## Handling And Storage

- Local development secrets should live in untracked local env files or host tooling.
- Hosted deployments must use the platform secret manager or environment configuration UI.
- Do not echo secrets in logs, screenshots, or issue threads.
- Production deployments must replace the development cookie secret.

## Pre-Merge Checklist

- [ ] `README.md` reflects the current variable set
- [ ] Public `VITE_*` variables are safe to expose
- [ ] No client code imports or logs server-only secrets
- [ ] Database secrets and token-encryption keys are stored only in server/runtime config
