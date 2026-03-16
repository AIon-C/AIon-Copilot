import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { ContextCachePort } from "../../../domain/ports/context-cache.port.js";
import type { ChatContextPort } from "../../../domain/ports/chat-context.port.js";
import { logger } from "../../../shared/logger.js";

export function createFetchContextTool(
  contextCache: ContextCachePort,
  chatContext: ChatContextPort,
) {
  return createTool({
    id: "fetch-context",
    description: "チャットのコンテキストメッセージを取得する",
    inputSchema: z.object({
      channelId: z.string().optional(),
      threadRootId: z.string().optional(),
    }),
    outputSchema: z.object({
      messages: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          displayName: z.string(),
          content: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
    execute: async (input) => {
      const { channelId, threadRootId } = input;

      if (!channelId) {
        return { messages: [] };
      }

      try {
        if (threadRootId) {
          const cached = await contextCache.getThreadMessages(threadRootId);
          if (cached.length > 0) return { messages: cached };
          const fallback = await chatContext.getThreadMessages(channelId, threadRootId);
          return { messages: fallback };
        }

        const cached = await contextCache.getChannelMessages(channelId);
        if (cached.length > 0) return { messages: cached };
        const fallback = await chatContext.getChannelMessages(channelId);
        return { messages: fallback };
      } catch (err) {
        logger.error({ err }, "Failed to fetch context");
        return { messages: [] };
      }
    },
  });
}
