import { getPool } from "./db.js";

export interface SignatureAuditEntry {
  id: number;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  signature_image: string | null;
  created_at: string;
}

export async function insertSignatureAuditLog(params: {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  signatureImage?: string | null;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO signature_audit_logs (email, ip_address, user_agent, signature_image)
     VALUES ($1, $2, $3, $4)`,
    [
      params.email,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.signatureImage ?? null,
    ]
  );
  console.log(`[SignatureAudit] Logged signature for ${params.email} from ${params.ipAddress ?? "unknown"}`);
}

export async function querySignatureAuditLog(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: SignatureAuditEntry[]; total: number }> {
  const pool   = getPool();
  const search = params.search?.trim() ?? "";
  const limit  = Math.min(200, Math.max(1, params.limit ?? 25));
  const offset = Math.max(0, params.offset ?? 0);

  const whereClause = search ? `WHERE LOWER(email) LIKE $1` : "";
  const baseParams: unknown[] = search ? [`%${search.toLowerCase()}%`] : [];

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM signature_audit_logs ${whereClause}`,
    baseParams
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const limitIdx  = baseParams.length + 1;
  const offsetIdx = baseParams.length + 2;

  const result = await pool.query(
    `SELECT id, email, ip_address, user_agent, signature_image, created_at
     FROM signature_audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...baseParams, limit, offset]
  );

  return {
    total,
    entries: result.rows.map((r) => ({
      id:              r.id,
      email:           r.email,
      ip_address:      r.ip_address,
      user_agent:      r.user_agent,
      signature_image: r.signature_image,
      created_at:      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    })),
  };
}
