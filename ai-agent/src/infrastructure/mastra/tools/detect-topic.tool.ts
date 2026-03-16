import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { TopicDetectorPort } from "../../../domain/ports/topic-detector.port.js";
import { logger } from "../../../shared/logger.js";

export function createDetectTopicTool(topicDetector: TopicDetectorPort) {
  return createTool({
    id: "detect-topic",
    description: "チャットメッセージの話題境界を検出する",
    inputSchema: z.object({
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
        const boundaryIndex = await topicDetector.detectBoundary(input.messages);
        return { boundaryIndex };
      } catch (err) {
        logger.error({ err }, "Failed to detect topic boundary");
        return { boundaryIndex: 0 };
      }
    },
  });
}
