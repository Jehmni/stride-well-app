AI Proxy and Migrations

This document explains how to run the hardened migration and start the AI proxy server used for meal-plan generation.

Files
- `fix_custom_workout_tables_hardened.sql` - Hardened, idempotent migration (repo root).
- `fix_custom_workout_tables_rollback.sql` - Rollback script (repo root).
- `server/ai-server.js` - Express-based AI proxy (exports `app` for testing).
- `server/ai-server-run.js` - CLI runner for the AI proxy (calls `app.listen`).

Environment variables
- Required for AI proxy: `OPENAI_API_KEY` (or `VITE_OPENAI_API_KEY`) and `AI_PROXY_KEY` (shared secret).
- Optional for persistence: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Optional toggles: `VITE_AI_PROXY_PERSIST` (set to `1` to request server-side persistence).

Run locally (development)
1. Install deps:

```bash
npm install
```

2. Start the AI proxy (local):

```bash
AI_PROXY_KEY=local-secret OPENAI_API_KEY=sk-xxx node server/ai-server-run.js
```

3. The proxy listens on port 4001 by default. Use `VITE_AI_PROXY_URL` in the client to point to the proxy.

Run the migration (recommended in staging first)
1. Backup or snapshot your DB.
2. Run the migration with a service account (psql or Supabase SQL editor):

```bash
psql "postgresql://<service_user>:<password>@<host>:5432/<db>" -f fix_custom_workout_tables_hardened.sql
```

3. Verify application behavior in staging.

CI
- A GitHub Actions workflow `/.github/workflows/ci.yml` runs `npm ci`, `npm run build`, and `npm run test:ci` on pushes and PRs.
- Store `OPENAI_API_KEY` and `AI_PROXY_KEY` in repository secrets if tests require them.

Testing
- Unit/integration tests use Vitest and Supertest. Run locally with:

```bash
npm run test
```

Notes
- The proxy will only persist generated meal plans when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided and the request body contains `persist: true`.
- Regenerate Supabase types in your frontend to include `enhanced_meal_plans` for full TypeScript safety.
