import type { AiMessage, CreateMessageInput } from "../types/index.js";

export interface MessageStorePort {
  save(input: CreateMessageInput): Promise<AiMessage>;
  findByThread(threadId: string): Promise<AiMessage[]>;
  deleteByThread(threadId: string): Promise<void>;
}
