import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { config } from 'dotenv';
import { Client } from 'pg';

config();

const MIGRATIONS_TABLE = 'schema_migrations';

async function baselineMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    await client.query(`
      create table if not exists public.${MIGRATIONS_TABLE} (
        name text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = (await readdir(migrationsDir))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    for (const migrationFile of migrationFiles) {
      await client.query(
        `
          insert into public.${MIGRATIONS_TABLE} (name)
          values ($1)
          on conflict (name) do nothing;
        `,
        [migrationFile],
      );
      console.log(`Baselined migration: ${migrationFile}`);
    }

    console.log('Migration baseline is up to date.');
  } finally {
    await client.end();
  }
}

baselineMigrations().catch((error: unknown) => {
  console.error('Migration baseline failed.');
  console.error(error);
  process.exitCode = 1;
});
