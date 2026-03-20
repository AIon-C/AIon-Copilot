import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { ContextCachePort } from "../../../domain/ports/context-cache.port.js";
import type { TopicDetectorPort } from "../../../domain/ports/topic-detector.port.js";
import { logger } from "../../../shared/logger.js";

const CACHE_REDETECT_THRESHOLD = 10;

export function createDetectTopicTool(
  topicDetector: TopicDetectorPort,
  contextCache: ContextCachePort,
) {
  return createTool({
    id: "detect-topic",
    description:
      "チャットメッセージの話題境界を検出する。メッセージ数が前回の検出時から大きく変わった場合のみ再検出する。",
    inputSchema: z.object({
      channelId: z.string().optional(),
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
    outputSchema: z.object({
      boundaryIndex: z.number(),
    }),
    execute: async (input) => {
      try {
        // Check cache if channelId is provided
        if (input.channelId) {
          const cached = await contextCache.getTopicBoundary(input.channelId);
          if (cached) {
            const diff = Math.abs(input.messages.length - cached.messageCount);
            if (diff < CACHE_REDETECT_THRESHOLD) {
              return { boundaryIndex: cached.boundaryIndex };
            }
          }
        }

        const boundaryIndex = await topicDetector.detectBoundary(input.messages);

        // Cache the result
        if (input.channelId) {
          await contextCache.setTopicBoundary(input.channelId, {
            boundaryIndex,
            messageCount: input.messages.length,
            cachedAt: new Date().toISOString(),
          });
        }

        return { boundaryIndex };
      } catch (err) {
        logger.error({ err }, "Failed to detect topic boundary");
        return { boundaryIndex: 0 };
      }
    },
  });
}
