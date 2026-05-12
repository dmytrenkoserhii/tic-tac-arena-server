import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { config } from 'dotenv';
import { Client } from 'pg';

config();

const MIGRATIONS_TABLE = 'schema_migrations';

async function runMigrations() {
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
      const { rowCount } = await client.query(
        `select 1 from public.${MIGRATIONS_TABLE} where name = $1`,
        [migrationFile],
      );

      if (rowCount) {
        console.log(`Skipping already applied migration: ${migrationFile}`);
        continue;
      }

      const migrationSql = await readFile(
        join(migrationsDir, migrationFile),
        'utf8',
      );

      console.log(`Applying migration: ${migrationFile}`);

      await client.query('begin');

      try {
        await client.query(migrationSql);
        await client.query(
          `insert into public.${MIGRATIONS_TABLE} (name) values ($1)`,
          [migrationFile],
        );
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }

    console.log('Database migrations are up to date.');
  } finally {
    await client.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error('Database migration failed.');
  console.error(error);
  process.exitCode = 1;
});
