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
