import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve, sep } from "path";
import { getDataDir } from "../userDataStore.js";

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

const DATA_DIR = resolve(getDataDir(), "ai-chats");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(email: string): string {
  const sanitized = email.toLowerCase().replace(/@/g, "_at_").replace(/[^a-z0-9._-]/g, "_");
  const fp = resolve(DATA_DIR, `${sanitized}.json`);
  const base = DATA_DIR + sep;
  if (!fp.startsWith(base) && fp !== DATA_DIR) {
    throw new Error("Path traversal blocked in chatStore");
  }
  return fp;
}

export function getConversation(email: string): Conversation {
  ensureDir();
  const fp = filePath(email);
  if (existsSync(fp)) {
    try {
      return JSON.parse(readFileSync(fp, "utf8"));
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
  writeFileSync(fp, JSON.stringify(conv, null, 2));
  return conv;
}

export function appendMessage(email: string, role: "user" | "assistant", content: string): void {
  ensureDir();
  const conv = getConversation(email);
  conv.messages.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();
  writeFileSync(filePath(email), JSON.stringify(conv, null, 2));
}

export function getRecentMessages(email: string, limit = 20): ChatMessage[] {
  const conv = getConversation(email);
  return conv.messages.slice(-limit);
}

export function clearConversation(email: string): void {
  ensureDir();
  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    email,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(filePath(email), JSON.stringify(conv, null, 2));
}
