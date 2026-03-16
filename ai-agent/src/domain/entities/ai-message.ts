export type MessageRole = "user" | "assistant";

export interface ContextRange {
  fromMessageId: string;
  toMessageId: string;
  messageCount: number;
  topicDetected: boolean;
}

export interface MessageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  modelVersion?: string;
  contextRange?: ContextRange;
}

export interface AiMessage {
  id: string;
  aiThreadId: string;
  role: MessageRole;
  content: string;
  metadata: MessageMetadata | null;
  createdAt: Date;
}

export interface CreateMessageInput {
  aiThreadId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata | null;
}
