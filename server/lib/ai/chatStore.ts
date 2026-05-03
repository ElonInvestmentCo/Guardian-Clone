import { getPool } from "../db.js";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  email: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  email: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession extends SessionSummary {
  messages: ChatMessage[];
}

export async function getConversation(email: string): Promise<Conversation> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT data FROM chat_conversations WHERE email = $1`,
    [email]
  );
  if (result.rows.length > 0) {
    try {
      return result.rows[0].data as Conversation;
    } catch {
      console.error(`[ChatStore] Failed to parse conversation for ${email}, creating new`);
    }
  }
  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    email,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO chat_conversations (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [email, JSON.stringify(conv)]
  );
  return conv;
}

export async function appendMessage(email: string, role: "user" | "assistant", content: string): Promise<void> {
  const conv = await getConversation(email);
  conv.messages.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();
  const pool = getPool();
  await pool.query(
    `INSERT INTO chat_conversations (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [email, JSON.stringify(conv)]
  );
}

export async function getRecentMessages(email: string, limit = 20): Promise<ChatMessage[]> {
  const conv = await getConversation(email);
  return conv.messages.slice(-limit);
}

export async function clearConversation(email: string): Promise<void> {
  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    email,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const pool = getPool();
  await pool.query(
    `INSERT INTO chat_conversations (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [email, JSON.stringify(conv)]
  );
}

export async function saveCurrentAsSession(email: string): Promise<string | null> {
  const conv = await getConversation(email);
  const visible = conv.messages.filter((m) => m.role !== "system");
  if (visible.length === 0) return null;

  const firstUser = visible.find((m) => m.role === "user");
  const title = firstUser
    ? firstUser.content.slice(0, 65) + (firstUser.content.length > 65 ? "…" : "")
    : "Conversation";

  const lastAssistant = [...visible].reverse().find((m) => m.role === "assistant");
  const preview = lastAssistant
    ? lastAssistant.content.replace(/\s+/g, " ").slice(0, 110) + (lastAssistant.content.length > 110 ? "…" : "")
    : title;

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const pool = getPool();

  await pool.query(
    `INSERT INTO chat_sessions (id, email, title, preview, messages, message_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      sessionId,
      email,
      title,
      preview,
      JSON.stringify(visible),
      visible.length,
      conv.createdAt || new Date().toISOString(),
    ]
  );

  return sessionId;
}

export async function listSessions(email: string): Promise<SessionSummary[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, title, preview, message_count, created_at, updated_at
     FROM chat_sessions
     WHERE email = $1
     ORDER BY updated_at DESC
     LIMIT 50`,
    [email]
  );
  return result.rows.map((r) => ({
    id: r.id,
    email: r.email,
    title: r.title,
    preview: r.preview,
    messageCount: r.message_count,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  }));
}

export async function getSession(id: string, email: string): Promise<ChatSession | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM chat_sessions WHERE id = $1 AND email = $2`,
    [id, email]
  );
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id,
    email: r.email,
    title: r.title,
    preview: r.preview,
    messageCount: r.message_count,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    messages: Array.isArray(r.messages) ? r.messages : [],
  };
}

export async function deleteSession(id: string, email: string): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM chat_sessions WHERE id = $1 AND email = $2`, [id, email]);
}

export async function restoreSession(email: string, sessionId: string): Promise<ChatMessage[]> {
  const session = await getSession(sessionId, email);
  if (!session) return [];

  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    email,
    messages: session.messages,
    createdAt: session.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const pool = getPool();
  await pool.query(
    `INSERT INTO chat_conversations (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [email, JSON.stringify(conv)]
  );
  return session.messages;
}
