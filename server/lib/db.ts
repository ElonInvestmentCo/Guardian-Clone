import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.PG_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "";
    if (!connectionString) {
      throw new Error("[DB] No database URL configured (PG_DATABASE_URL or DATABASE_URL)");
    }
    pool = new Pool({
      connectionString,
      ssl: false,
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
    CREATE INDEX IF NOT EXISTS idx_users_status ON users ((data->>'status'));
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_user_docs_email ON user_documents (email);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS registration_log (
      id                SERIAL PRIMARY KEY,
      email             TEXT NOT NULL,
      display_name      TEXT,
      referrer          TEXT,
      product           TEXT,
      registration_type TEXT,
      ip_address        TEXT,
      registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    CREATE INDEX IF NOT EXISTS idx_reg_log_email ON registration_log (email);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_reg_log_time ON registration_log (registered_at DESC);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sig_audit_email ON signature_audit_logs (email);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_sig_audit_created_at ON signature_audit_logs (created_at DESC);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      user_email  TEXT,
      meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_read     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_notif_read ON admin_notifications (is_read);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_notif_created_at ON admin_notifications (created_at DESC);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS user_orders (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      symbol      TEXT NOT NULL,
      side        TEXT NOT NULL,
      type        TEXT NOT NULL,
      qty         NUMERIC NOT NULL,
      price       NUMERIC,
      filled      NUMERIC NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'Active',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_user_orders_email ON user_orders (email, created_at DESC);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS fund_requests (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      type        TEXT NOT NULL,
      amount      NUMERIC NOT NULL,
      note        TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      admin_note  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_fund_requests_email ON fund_requests (email, created_at DESC);
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON fund_requests (status, created_at DESC);
  `);

  console.log("[DB] Database tables initialized successfully");
}

export async function shutdownDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("[DB] Connection pool closed");
  }
}
