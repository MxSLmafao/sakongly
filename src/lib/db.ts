import Database from "@tauri-apps/plugin-sql";
import type { Conversation, Message, SystemPrompt } from "./types";
import { ulid } from "ulid";

let _db: Awaited<ReturnType<typeof Database.load>> | null = null;

async function db() {
  if (!_db) {
    _db = await Database.load("sqlite:sakongly.db");
    await _db.execute(`PRAGMA foreign_keys = ON`);
  }
  return _db;
}

export const conversationDb = {
  async list(): Promise<Conversation[]> {
    const d = await db();
    return d.select<Conversation[]>(
      "SELECT * FROM conversations ORDER BY updated_at DESC"
    );
  },

  async get(id: string): Promise<Conversation | null> {
    const d = await db();
    const rows = await d.select<Conversation[]>(
      "SELECT * FROM conversations WHERE id = ?",
      [id]
    );
    return rows[0] ?? null;
  },

  async create(title: string, providerId: string | null): Promise<Conversation> {
    const d = await db();
    const id = ulid();
    const now = Date.now();
    await d.execute(
      "INSERT INTO conversations (id, title, provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, title, providerId, now, now]
    );
    return { id, title, provider_id: providerId, created_at: now, updated_at: now };
  },

  async updateTitle(id: string, title: string): Promise<void> {
    const d = await db();
    await d.execute("UPDATE conversations SET title = ? WHERE id = ?", [title, id]);
  },

  async delete(id: string): Promise<void> {
    const d = await db();
    await d.execute("DELETE FROM conversations WHERE id = ?", [id]);
  },

  async search(query: string): Promise<Conversation[]> {
    const d = await db();
    return d.select<Conversation[]>(
      "SELECT * FROM conversations WHERE title LIKE ? ORDER BY updated_at DESC",
      [`%${query}%`]
    );
  },
};

export const messageDb = {
  async list(conversationId: string): Promise<Message[]> {
    const d = await db();
    return d.select<Message[]>(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );
  },

  async create(
    conversationId: string,
    role: Message["role"],
    content: string,
    attachmentsJson?: string
  ): Promise<Message> {
    const d = await db();
    const id = ulid();
    const now = Date.now();
    await d.execute(
      "INSERT INTO messages (id, conversation_id, role, content, attachments_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, conversationId, role, content, attachmentsJson ?? null, now]
    );
    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      attachments_json: attachmentsJson ?? null,
      created_at: now,
    };
  },

  async updateContent(id: string, content: string): Promise<void> {
    const d = await db();
    await d.execute("UPDATE messages SET content = ? WHERE id = ?", [content, id]);
  },

  async delete(id: string): Promise<void> {
    const d = await db();
    await d.execute("DELETE FROM messages WHERE id = ?", [id]);
  },
};

export const systemPromptDb = {
  async list(): Promise<SystemPrompt[]> {
    const d = await db();
    return d.select<SystemPrompt[]>("SELECT * FROM system_prompts ORDER BY created_at DESC");
  },

  async create(name: string, body: string): Promise<SystemPrompt> {
    const d = await db();
    const id = ulid();
    const now = Date.now();
    await d.execute(
      "INSERT INTO system_prompts (id, name, body, created_at) VALUES (?, ?, ?, ?)",
      [id, name, body, now]
    );
    return { id, name, body, created_at: now };
  },

  async update(id: string, name: string, body: string): Promise<void> {
    const d = await db();
    await d.execute("UPDATE system_prompts SET name = ?, body = ? WHERE id = ?", [name, body, id]);
  },

  async delete(id: string): Promise<void> {
    const d = await db();
    await d.execute("DELETE FROM system_prompts WHERE id = ?", [id]);
  },
};
