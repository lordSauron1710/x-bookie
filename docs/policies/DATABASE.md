# Database Policy

x-bookie does not use a durable database at runtime yet.

The current backend store is in-memory. Sessions and synced bookmarks are lost on restart.

## Current State

- No active database client in the runtime request path
- No active migrations
- Draft Postgres schema exists in `db/schema.sql`
- No durable synced user data yet

## Rules If Durable Persistence Is Added

- All privileged database access must stay server-side.
- Never expose service-role credentials or private connection strings to the browser.
- Use parameterized queries or a safe query builder.
- Apply least privilege for database access.
- Encrypt or otherwise protect sensitive token material at rest.
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
