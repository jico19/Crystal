import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const connectionString = env.DATABASE_URL;

export const db = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Diagnostic helper: Tests pool connectivity on boot and prints friendly error details if credentials fail
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await db.connect();
    const res = await client.query('SELECT current_database(), current_user;');
    client.release();
    const { current_database, current_user } = res.rows[0];
    console.log(`✅ Connected to Database [${current_database}] as user [${current_user}]`);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`\n⚠️  [Database Connection Warning] Unable to connect to PostgreSQL:`);
    console.warn(`   Target Connection String: "${connectionString.replace(/:([^@]+)@/, ':****@')}"`);
    console.warn(`   Details: ${errorMsg}`);
    console.warn(`   💡 Tip: Check your username, password, host, and database name in "apps/api/.env"\n`);
    return false;
  }
}

export { SqlQueryBuilder } from './query-builder.js';

