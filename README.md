# Tic Tac Arena Server

Backend workspace for Tic Tac Arena.

For v1, Supabase owns most backend capabilities:

- Auth through Supabase Auth
- Data storage through Supabase Postgres
- Realtime updates through Supabase Realtime
- Move validation through Postgres RPC

The NestJS app owns protected mutation endpoints. The web app still uses Supabase directly for Auth, reads, and Realtime subscriptions.

## Hybrid Backend Boundary

The current v1 architecture is intentionally hybrid:

- The web app signs users in with Supabase Auth.
- The web app sends the Supabase access token to Nest as `Authorization: Bearer <access_token>`.
- `SupabaseAuthGuard` validates that token before protected controller methods run.
- Nest creates a per-request Supabase client with the same user token, not a service-role key.
- Supabase Row Level Security still decides what the authenticated user can read or mutate.
- The web app reads `profiles`, `rooms`, `games`, and `moves` directly from Supabase.
- The web app subscribes to Supabase Realtime for `rooms`, `games`, and `moves`.
- Nest owns writes and RPC calls that represent gameplay mutations.

In short: web handles session, reads, and realtime; Nest handles protected commands; Supabase remains the database and authorization boundary.

Current protected mutation endpoints:

All endpoints below require:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

| Endpoint | Body | Responsibility |
| --- | --- | --- |
| `POST /profiles/sync` | none | Creates or updates the signed-in user's profile from Supabase Auth metadata. |
| `POST /rooms` | none | Creates a private waiting room for the signed-in host. |
| `POST /rooms/join` | `{ "code": "ABC123" }` | Joins the signed-in user to an available waiting room. |
| `POST /rooms/:roomId/leave` | none | Closes a room when a player leaves. |
| `POST /games` | `{ "roomId": "..." }` | Starts or returns the active game for a ready room. Host only. |
| `POST /games/:gameId/moves` | `{ "cellIndex": 0 }` | Creates a move through the `make_move` RPC. |

Expected response bodies are the affected Supabase records: `profile`, `room`, `game`, or `move`.

Expected error responses use Nest's standard shape:

```json
{
  "message": "It is not your turn.",
  "error": "Bad Request",
  "statusCode": 400
}
```

Supabase and RPC errors should be normalized before they leave the server. Keep user-facing messages in `src/supabase/supabase-error.ts`.

## Current Role

This repository currently owns database schema history:

```bash
supabase/migrations
```

Commit SQL migrations here. Apply them through the code-driven migration runner, not manually through the Supabase SQL Editor.

## Applying Migrations

Create a local env file with a Supabase Postgres connection string:

```bash
DATABASE_URL=
```

For local development, run:

```bash
pnpm migrate:dev
```

For production-like execution after build, run:

```bash
pnpm build
pnpm migrate:up
```

If an existing database was previously migrated manually, run this once to mark current migration files as already applied:

```bash
pnpm migrate:baseline
```

New migrations are applied in numeric filename order and recorded in `public.schema_migrations`.

## Important Supabase Objects

- `profiles` stores one profile row per authenticated Supabase user.
- `rooms` stores private room membership and room status.
- `games` stores one game record per round.
- `moves` stores append-only move history.
- `make_move` validates turn order, occupied cells, player ownership, and final game outcome.

Realtime is enabled for:

- `rooms`
- `games`
- `moves`

## Nest Commands

Install dependencies:

```bash
pnpm install
```

Create a local env file:

```bash
cp .env.example .env
```

Fill in:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
WEB_ORIGIN=http://localhost:5173
PORT=3000
```

Use the public Supabase anon/publishable key here. Do not use service role unless a future server-only feature explicitly requires it.

Run Nest in watch mode:

```bash
pnpm start:dev
```

Run the web app from the sibling repository:

```bash
cd ../tic-tac-arena-web
pnpm dev
```

The web env should point to this API:

```bash
VITE_API_URL=http://localhost:3000
```

Build Nest:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

## Deployment Env Inventory

This project is not Dockerized yet. Use this inventory when adding Docker, CI/CD, or hosted environments later.

### Web Runtime

Defined in `../tic-tac-arena-web`.

| Variable | Local value | Production value | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase project URL | Public URL used by the browser. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key | Supabase anon/publishable key | Safe for browser use when RLS is enabled. Never use service role here. |
| `VITE_API_URL` | `http://localhost:3000` | Public Nest API origin | Must not include a trailing slash. |

### Server Runtime

Defined in this repository.

| Variable | Local value | Production value | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Supabase project URL | Supabase project URL | Same value as `VITE_SUPABASE_URL`, without the `VITE_` prefix. |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key | Supabase anon/publishable key | Used with the user's JWT for RLS-protected requests. |
| `WEB_ORIGIN` | `http://localhost:5173` | Public web app origin | Used for CORS. Must match the deployed frontend origin. |
| `PORT` | `3000` | Platform-provided or configured port | The Nest listener port. |

### Supabase Configuration

These settings live in the Supabase dashboard, not in either repository:

- Google Auth provider client id and secret.
- Site URL and redirect URLs for local and production web origins.
- Database schema from `supabase/migrations`.
- Realtime enabled for `rooms`, `games`, and `moves`.

### Secret Rules

- Do not put Supabase service-role keys in the web app.
- Do not commit `.env`, `.env.local`, or production secrets.
- Keep OAuth provider secrets in Supabase or the deployment secret manager.
- Introduce `SUPABASE_SERVICE_ROLE_KEY` only when a future server-only admin feature explicitly needs it.

## When Nest Should Be Used

Prefer Supabase for simple v1 flows. Add Nest runtime logic when we need:

- protected API endpoints with Supabase JWT validation
- server-owned orchestration that is awkward in SQL
- rate limiting or anti-abuse logic
- admin/service-role operations
- webhooks or background jobs
- statistics, leaderboard, or aggregation workflows
