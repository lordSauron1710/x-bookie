# Deployment Policy

x-bookie must remain easy to deploy as a frontend application while leaving room for secure future backend additions.

## Current Deployment Shape

- Framework: Vite + React
- Standard build command: `npm run build`
- Current runtime posture: frontend-first, local-first, no auth layer, no backend API, no database

## Deployment Rules

- Production deployments must use a production build.
- Keep the app portable.
  - No host-specific filesystem writes for runtime state.
  - No long-lived machine-local assumptions.
- Any future backend component must remain stateless or clearly document its hosting assumptions.
- Any new environment variable must be documented in [ENV_VARIABLES.md](./ENV_VARIABLES.md) and `README.md`.
- Preview deployments must not silently point at privileged production services.

## Security Baseline For Deployments

- Serve security headers when deployment settings are introduced or changed:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - clickjacking protection via `X-Frame-Options` or CSP `frame-ancestors`
  - restrictive `Permissions-Policy` for unused browser features
- Do not expose stack traces or debug mode in production.
- Keep source maps private or intentionally managed if they are published.

## Required Validation Before Release

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `README.md` reflects deploy or config changes
- [ ] New external services or secrets are documented
