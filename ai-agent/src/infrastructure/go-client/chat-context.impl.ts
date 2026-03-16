import type { ChatContextPort } from "../../domain/ports/chat-context.port.js";
import type { ChatContextMessage } from "../../domain/types/index.js";
import { config } from "../../shared/config.js";
import { ServiceUnavailableError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";

export class GoBackendChatContextImpl implements ChatContextPort {
  private readonly baseUrl = config.GO_BACKEND_URL;

  async getChannelMessages(channelId: string, pageSize = 30): Promise<ChatContextMessage[]> {
    const url = `${this.baseUrl}/chatapp.message.v1.MessageService/GetMessages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, pageSize }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Go Backend returned ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return this.mapResponse(data);
    } catch (err) {
      logger.error({ err, channelId }, "Failed to fetch channel messages from Go Backend");
      throw new ServiceUnavailableError("Go Backend");
    }
  }

  async getThreadMessages(
    channelId: string,
    threadRootId: string,
    pageSize = 30,
  ): Promise<ChatContextMessage[]> {
    const url = `${this.baseUrl}/chatapp.message.v1.MessageService/GetMessages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, threadRootId, pageSize }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Go Backend returned ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return this.mapResponse(data);
    } catch (err) {
      logger.error({ err, channelId, threadRootId }, "Failed to fetch thread messages from Go Backend");
      throw new ServiceUnavailableError("Go Backend");
    }
  }

  private mapResponse(data: Record<string, unknown>): ChatContextMessage[] {
    const messages = (data.messages ?? []) as Record<string, unknown>[];
    return messages.map((m) => ({
      id: (m.id as string) ?? "",
      userId: (m.userId as string) ?? (m.user_id as string) ?? "",
      displayName: (m.displayName as string) ?? (m.display_name as string) ?? "Unknown",
      content: (m.content as string) ?? "",
      createdAt: (m.createdAt as string) ?? (m.created_at as string) ?? "",
    }));
  }
}
