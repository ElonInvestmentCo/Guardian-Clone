import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbAvailable = false;

export function isDatabaseAvailable(): boolean {
  return dbAvailable;
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.PG_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "";
    if (!connectionString) {
      throw new Error("[DB] No database URL configured (PG_DATABASE_URL or DATABASE_URL)");
    }
    const isRemote =
      connectionString.includes("railway") ||
      connectionString.includes("render") ||
      connectionString.includes("supabase") ||
      connectionString.includes("neon") ||
      process.env.NODE_ENV === "production";
    pool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err.message);
    });
  }
  return pool;
}

export async function query(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult> {
  const client = getPool();
  return client.query(text, params);
}

export async function initDatabase(): Promise<void> {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      email       TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      email       TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      email       TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS user_documents (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL,
      role        TEXT NOT NULL,
      filename    TEXT NOT NULL,
      mimetype    TEXT,
      file_data   BYTEA,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(email, role)
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS signature_audit_logs (
      id              SERIAL PRIMARY KEY,
      email           TEXT NOT NULL,
      ip_address      TEXT,
      user_agent      TEXT,
      signature_image TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_users_status ON users ((data->>'status'));
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_user_docs_email ON user_documents (email);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sig_audit_email ON signature_audit_logs (email);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sig_audit_created_at ON signature_audit_logs (created_at DESC);
  `);

  dbAvailable = true;
  console.log("[DB] Database tables initialized successfully");
}

export async function shutdownDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbAvailable = false;
    console.log("[DB] Connection pool closed");
  }
}
