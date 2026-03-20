import type { AiMessage, CreateMessageInput } from "../types/index.js";

export interface MessageStorePort {
  save(input: CreateMessageInput): Promise<AiMessage>;
  findByThread(threadId: string): Promise<AiMessage[]>;
  findByThreadPaginated(
    threadId: string,
    limit: number,
    offset: number,
  ): Promise<{ messages: AiMessage[]; total: number }>;
  deleteByThread(threadId: string): Promise<void>;
}
