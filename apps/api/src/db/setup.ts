import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/crystal_db';

// Extract connection parameters for connecting to default 'postgres' db
const urlObj = new URL(connectionString);
const targetDbName = urlObj.pathname.replace(/^\//, '') || 'crystal_db';

// Create connection string targeting default 'postgres' database to check/create target database
const defaultDbUrl = `${urlObj.protocol}//${urlObj.username}:${urlObj.password}@${urlObj.hostname}:${urlObj.port}/postgres`;

const { Client } = pg;

async function setupLocalDatabase() {
  console.log(`\n🐘 [Local PostgreSQL Setup Runner] Initializing database setup...`);
  console.log(`   Target Database: "${targetDbName}"`);
  console.log(`   Host: ${urlObj.hostname}:${urlObj.port}`);

  // Step 1: Connect to default 'postgres' db and ensure targetDbName exists
  const defaultClient = new Client({ connectionString: defaultDbUrl });
  try {
    await defaultClient.connect();
    const checkRes = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [targetDbName]
    );

    if (checkRes.rows.length === 0) {
      console.log(`🔨 Creating database "${targetDbName}"...`);
      await defaultClient.query(`CREATE DATABASE "${targetDbName}";`);
      console.log(`✅ Database "${targetDbName}" created successfully.`);
    } else {
      console.log(`ℹ️  Database "${targetDbName}" already exists.`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Unable to connect to PostgreSQL server: ${errorMsg}`);
    console.error(`💡 Ensure local PostgreSQL is running and credentials in apps/api/.env are correct.`);
    process.exit(1);
  } finally {
    await defaultClient.end();
  }

  // Step 2: Connect to target database and apply migrations & seeds
  const targetClient = new Client({ connectionString });
  try {
    await targetClient.connect();
    console.log(`⚡ Connected to "${targetDbName}". Applying DDL migrations and seed data...`);

    // Path to db_schema directory
    const dbSchemaDir = path.resolve(__dirname, '../../../../db_schema');
    const migrationsDir = path.join(dbSchemaDir, 'migrations');
    const seedFilePath = path.join(dbSchemaDir, 'seed_organizations.sql');

    // Apply all migrations in migrations/ sorted alphabetically
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        console.log(`📄 Executing migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await targetClient.query(sql);
        console.log(`✅ Migration "${file}" applied successfully.`);
      }
    } else {
      console.warn(`⚠️ Migrations directory not found at: ${migrationsDir}`);
    }

    // Apply seed
    if (fs.existsSync(seedFilePath)) {
      console.log(`🌱 Executing seed: seed_organizations.sql`);
      const seedSql = fs.readFileSync(seedFilePath, 'utf-8');
      await targetClient.query(seedSql);
      console.log(`✅ Organization seed data inserted successfully.`);
    } else {
      console.warn(`⚠️ Seed file not found at: ${seedFilePath}`);
    }

    // Query seeded organizations to display summary
    const orgsRes = await targetClient.query(
      `SELECT name, state_code, primary_domain FROM public.organizations;`
    );

    console.log(`\n🎉 [Setup Complete] Database "${targetDbName}" is ready!`);
    console.log(`   Seeded Organization Tenants:`);
    orgsRes.rows.forEach((row) => {
      console.log(`   • ${row.name} (${row.state_code}) → ${row.primary_domain}`);
    });
    console.log(`\n🚀 You can now start the Express API using "npm run dev" inside apps/api!\n`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Migration/Seed Error: ${errorMsg}`);
    process.exit(1);
  } finally {
    await targetClient.end();
  }
}

setupLocalDatabase();
