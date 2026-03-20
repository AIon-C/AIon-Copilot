import type { Pool } from "pg";
import { v4 as uuid } from "uuid";
import type { MessageStorePort } from "../../../domain/ports/message-store.port.js";
import type {
  AiMessage,
  CreateMessageInput,
  MessageMetadata,
} from "../../../domain/types/index.js";

export class PgMessageStoreImpl implements MessageStorePort {
  constructor(private readonly pool: Pool) {}

  async save(input: CreateMessageInput): Promise<AiMessage> {
    const id = uuid();
    const now = new Date();
    const result = await this.pool.query(
      `INSERT INTO ai_messages (id, ai_thread_id, role, content, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        input.aiThreadId,
        input.role,
        input.content,
        input.metadata ? JSON.stringify(input.metadata) : null,
        now,
      ],
    );
    return this.mapRow(result.rows[0]);
  }

  async findByThread(threadId: string): Promise<AiMessage[]> {
    const result = await this.pool.query(
      "SELECT * FROM ai_messages WHERE ai_thread_id = $1 ORDER BY created_at ASC",
      [threadId],
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async findByThreadPaginated(
    threadId: string,
    limit: number,
    offset: number,
  ): Promise<{ messages: AiMessage[]; total: number }> {
    const [dataResult, countResult] = await Promise.all([
      this.pool.query(
        "SELECT * FROM ai_messages WHERE ai_thread_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3",
        [threadId, limit, offset],
      ),
      this.pool.query("SELECT COUNT(*)::int AS total FROM ai_messages WHERE ai_thread_id = $1", [
        threadId,
      ]),
    ]);
    return {
      messages: dataResult.rows.map((row) => this.mapRow(row)),
      total: countResult.rows[0].total,
    };
  }

  async deleteByThread(threadId: string): Promise<void> {
    await this.pool.query("DELETE FROM ai_messages WHERE ai_thread_id = $1", [threadId]);
  }

  private mapRow(row: Record<string, unknown>): AiMessage {
    return {
      id: row.id as string,
      aiThreadId: row.ai_thread_id as string,
      role: row.role as "user" | "assistant",
      content: row.content as string,
      metadata: (row.metadata as MessageMetadata) ?? null,
      createdAt: new Date(row.created_at as string),
    };
  }
}
