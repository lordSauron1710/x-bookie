# Database Policy

x-bookie can run with a durable Postgres-backed store when database configuration is present.

Without that configuration, the backend falls back to the in-memory store and server-side data is lost on restart.

## Current State

- Postgres is optional in the runtime request path
- The schema is initialized from `db/schema.sql` at startup when Postgres is enabled
- Durable data includes users, sessions, encrypted X connections, synced bookmarks, and OAuth transactions
- Postgres-backed deployments also use shared rate-limit buckets instead of per-process memory
- No browser code can reach the database directly

## Rules If Durable Persistence Is Added

- All privileged database access must stay server-side.
- Never expose service-role credentials or private connection strings to the browser.
- Use parameterized queries or a safe query builder.
- Apply least privilege for database access.
- Encrypt or otherwise protect sensitive token material at rest.
- Require `TOKEN_ENCRYPTION_KEY` before enabling Postgres token storage.
- Review migrations for destructive changes, accidental public access, and unsafe defaults.
- Document the data model, retention expectations, and operational assumptions in `README.md`.

## Required Companion Changes

If durable database support is added, update:

- [SECURITY.md](./SECURITY.md)
- [API.md](./API.md)
- [AUTH.md](./AUTH.md)
- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- `README.md`
