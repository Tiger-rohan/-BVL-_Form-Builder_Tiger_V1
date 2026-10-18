import { PGlite } from '@electric-sql/pglite';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import fs from 'fs';

// Database Interface
export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<any>;
}

export type DbEngineType = 'external-postgresql' | 'embedded-pglite';

export interface DatabaseMetadata {
  engine: DbEngineType;
  connected: boolean;
  target: string;
  autoMigrated: boolean;
  latencyMs: number;
  tables: string[];
  stats: {
    users: number;
    forms: number;
    form_versions: number;
    submissions: number;
  };
  error?: string;
}

// 1. Determine connection strategy
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
let dbClient: DbClient;
let activeEngine: DbEngineType = 'embedded-pglite';
let targetDescription = 'Local Embedded Database (./data/postgres)';
let connectionPool: InstanceType<typeof Pool> | null = null;

if (databaseUrl && databaseUrl.trim().length > 0) {
  try {
    const urlObj = new URL(databaseUrl);
    targetDescription = `${urlObj.hostname}:${urlObj.port || '5432'} / ${urlObj.pathname.replace('/', '')}`;
    activeEngine = 'external-postgresql';

    connectionPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    const pool = connectionPool;
    dbClient = {
      async query<T = any>(sql: string, params?: any[]) {
        const res = await pool.query(sql, params);
        return { rows: res.rows as T[] };
      },
      async exec(sql: string) {
        return pool.query(sql);
      },
    };
    console.log(`[FormForge DB] Connecting to External PostgreSQL: ${targetDescription}`);
  } catch (err: any) {
    console.warn(`[FormForge DB] Invalid DATABASE_URL, falling back to embedded PGlite: ${err.message}`);
    activeEngine = 'embedded-pglite';
    const dataDir = path.resolve(process.cwd(), 'data/postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    targetDescription = 'Local Embedded PGlite (./data/postgres)';
    dbClient = new PGlite(dataDir);
  }
} else {
  activeEngine = 'embedded-pglite';
  const dataDir = path.resolve(process.cwd(), 'data/postgres');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  targetDescription = 'Local Embedded PGlite (./data/postgres)';
  dbClient = new PGlite(dataDir);
  console.log(`[FormForge DB] Initialized Local Embedded PGlite: ${dataDir}`);
}

export const pg: DbClient = dbClient;

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;

  // Run initial core schema
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      current_version INT NOT NULL DEFAULT 1,
      schema TEXT NOT NULL,
      settings TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS form_versions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      version_number INT NOT NULL,
      schema TEXT NOT NULL,
      changelog TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (form_id, version_number)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      form_version INT NOT NULL,
      data TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      field_mappings TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_logs (
      id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      response_code INT,
      response_body TEXT,
      retry_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
    CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
    CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
  `);

  isInitialized = true;
  console.log(`[FormForge DB] Schema initialized successfully on ${activeEngine}.`);
}

export async function getDatabaseDiagnostics(): Promise<DatabaseMetadata> {
  const start = Date.now();
  try {
    const ping = await pg.query<{ val: number }>('SELECT 1 as val');
    const latencyMs = Date.now() - start;

    const [uRes, fRes, vRes, sRes] = await Promise.all([
      pg.query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      pg.query<{ count: string }>('SELECT COUNT(*) as count FROM forms'),
      pg.query<{ count: string }>('SELECT COUNT(*) as count FROM form_versions'),
      pg.query<{ count: string }>('SELECT COUNT(*) as count FROM submissions'),
    ]);

    return {
      engine: activeEngine,
      connected: ping.rows.length > 0,
      target: targetDescription,
      autoMigrated: true,
      latencyMs,
      tables: ['users', 'forms', 'form_versions', 'submissions', 'integrations', 'delivery_logs'],
      stats: {
        users: parseInt(uRes.rows[0]?.count || '0', 10),
        forms: parseInt(fRes.rows[0]?.count || '0', 10),
        form_versions: parseInt(vRes.rows[0]?.count || '0', 10),
        submissions: parseInt(sRes.rows[0]?.count || '0', 10),
      },
    };
  } catch (err: any) {
    return {
      engine: activeEngine,
      connected: false,
      target: targetDescription,
      autoMigrated: false,
      latencyMs: Date.now() - start,
      tables: [],
      stats: { users: 0, forms: 0, form_versions: 0, submissions: 0 },
      error: err.message || 'Database query error',
    };
  }
}
