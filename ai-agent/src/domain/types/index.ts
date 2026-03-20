export type {
  AiMessage,
  ContextRange,
  CreateMessageInput,
  MessageMetadata,
  MessageRole,
} from "../entities/ai-message.js";
export type {
  AiThread,
  CreateThreadInput,
} from "../entities/ai-thread.js";
export { getScope } from "../entities/ai-thread.js";

export type {
  ChatContext,
  ChatContextMessage,
} from "../entities/chat-context.js";

export type {
  ChannelScope,
  FreeScope,
  Scope,
  ThreadScope,
} from "../entities/scope.js";
export { determineScope } from "../entities/scope.js";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TopicBoundaryCache {
  boundaryIndex: number;
  messageCount: number;
  cachedAt: string;
}
