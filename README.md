# Tic Tac Arena Server

Backend workspace for Tic Tac Arena.

For v1, Supabase owns most backend capabilities:

- Auth through Supabase Auth
- Data storage through Supabase Postgres
- Realtime updates through Supabase Realtime
- Move validation through Postgres RPC

The NestJS app owns protected mutation endpoints. The web app still uses Supabase directly for Auth, reads, and Realtime subscriptions.

Current protected mutation endpoints:

- `POST /rooms`
- `POST /rooms/join`
- `POST /rooms/:roomId/leave`
- `POST /games`
- `POST /games/:gameId/moves`

## Current Role

This repository currently owns database schema history:

```bash
supabase/migrations
```

Commit SQL migrations here. Apply them manually in the Supabase SQL Editor during local development.

## Applying Migrations

1. Open the Supabase project dashboard.
2. Go to SQL Editor.
3. Open the next migration file from `supabase/migrations`.
4. Paste the full SQL into the editor.
5. Run it.
6. Verify the affected table/function/realtime behavior in the dashboard or web app.

Apply migrations in numeric order.

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

Build Nest:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

## When Nest Should Be Used

Prefer Supabase for simple v1 flows. Add Nest runtime logic when we need:

- protected API endpoints with Supabase JWT validation
- server-owned orchestration that is awkward in SQL
- rate limiting or anti-abuse logic
- admin/service-role operations
- webhooks or background jobs
- statistics, leaderboard, or aggregation workflows
