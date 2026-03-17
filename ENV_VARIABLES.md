# Environment Variables Policy

SignalShelf does not currently require any environment variables for local development or deployment.

That is the current baseline. Do not add environment variables casually.

## Current Inventory

- Required variables: none
- Optional variables: none
- Client-exposed variables: none

## Rules For Adding Variables

- Document every new variable in `README.md`.
- If a new variable is intended for browser code, remember that Vite `VITE_*` values are public by definition.
- Keep secrets server-only.
- Do not hardcode API URLs, tokens, client secrets, or environment-specific IDs in source files.
- Remove unused variables when the code that depends on them is removed.

## Handling And Storage

- Local development secrets should live in untracked local env files or host tooling.
- Hosted deployments must use the platform secret manager or environment configuration UI.
- Do not echo secrets in logs, screenshots, or issue threads.

## Pre-Merge Checklist

- [ ] `README.md` reflects the new variable set
- [ ] Public variables are safe to expose in browser bundles
- [ ] No client code imports or logs server-only secrets
