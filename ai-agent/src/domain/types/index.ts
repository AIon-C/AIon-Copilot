export type {
  AiThread,
  CreateThreadInput,
} from "../entities/ai-thread.js";
export { getScope } from "../entities/ai-thread.js";

export type {
  AiMessage,
  CreateMessageInput,
  MessageMetadata,
  ContextRange,
  MessageRole,
} from "../entities/ai-message.js";

export type {
  ChatContextMessage,
  ChatContext,
} from "../entities/chat-context.js";

export type {
  Scope,
  ChannelScope,
  ThreadScope,
  FreeScope,
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
