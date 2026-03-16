import type { Pool } from "pg";
import { v4 as uuid } from "uuid";
import type { ThreadStorePort } from "../../../domain/ports/thread-store.port.js";
import type { AiThread, CreateThreadInput } from "../../../domain/types/index.js";

export class PgThreadStoreImpl implements ThreadStorePort {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateThreadInput): Promise<AiThread> {
    const id = uuid();
    const now = new Date();
    const result = await this.pool.query(
      `INSERT INTO ai_threads (id, workspace_id, user_id, channel_id, thread_root_id, title, model, system_prompt, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        input.workspaceId,
        input.userId,
        input.channelId ?? null,
        input.threadRootId ?? null,
        input.title,
        input.model ?? "gemini-2.5-flash",
        input.systemPrompt ? JSON.stringify(input.systemPrompt) : null,
        now,
        now,
      ],
    );
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<AiThread | null> {
    const result = await this.pool.query("SELECT * FROM ai_threads WHERE id = $1", [id]);
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<AiThread[]> {
    const result = await this.pool.query(
      "SELECT * FROM ai_threads WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId],
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async updateTitle(id: string, title: string): Promise<AiThread> {
    const now = new Date();
    const result = await this.pool.query(
      "UPDATE ai_threads SET title = $1, updated_at = $2 WHERE id = $3 RETURNING *",
      [title, now, id],
    );
    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM ai_threads WHERE id = $1", [id]);
  }

  private mapRow(row: Record<string, unknown>): AiThread {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      channelId: (row.channel_id as string) ?? null,
      threadRootId: (row.thread_root_id as string) ?? null,
      title: row.title as string,
      model: row.model as string,
      systemPrompt: row.system_prompt as Record<string, unknown> | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
