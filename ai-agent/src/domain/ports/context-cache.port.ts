import type { ChatContextMessage, TopicBoundaryCache } from "../types/index.js";

export interface ContextCachePort {
  getChannelMessages(channelId: string): Promise<ChatContextMessage[]>;
  getThreadMessages(threadRootId: string): Promise<ChatContextMessage[]>;
  getTopicBoundary(channelId: string): Promise<TopicBoundaryCache | null>;
  setTopicBoundary(channelId: string, boundary: TopicBoundaryCache): Promise<void>;
}
