import type { ContextCachePort } from "../../../domain/ports/context-cache.port.js";
import type { ChatContextMessage, TopicBoundaryCache } from "../../../domain/types/index.js";
import { getRedisClient } from "./client.js";

export class RedisContextCacheImpl implements ContextCachePort {
  async getChannelMessages(channelId: string): Promise<ChatContextMessage[]> {
    const redis = getRedisClient();
    const key = `chat:ctx:channel:${channelId}`;
    const members = await redis.zrange(key, 0, -1);
    return members.map((m: string) => JSON.parse(m) as ChatContextMessage);
  }

  async getThreadMessages(threadRootId: string): Promise<ChatContextMessage[]> {
    const redis = getRedisClient();
    const key = `chat:ctx:thread:${threadRootId}`;
    const members = await redis.zrange(key, 0, -1);
    return members.map((m: string) => JSON.parse(m) as ChatContextMessage);
  }

  async getTopicBoundary(channelId: string): Promise<TopicBoundaryCache | null> {
    const redis = getRedisClient();
    const key = `topic:boundary:channel:${channelId}`;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as TopicBoundaryCache;
  }

  async setTopicBoundary(channelId: string, boundary: TopicBoundaryCache): Promise<void> {
    const redis = getRedisClient();
    const key = `topic:boundary:channel:${channelId}`;
    await redis.set(key, JSON.stringify(boundary), "EX", 300);
  }
}
