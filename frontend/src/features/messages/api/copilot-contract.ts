export type CopilotApiMode = 'mock' | 'stub' | 'real';

export interface AiThreadDto {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  scope: {
    type: 'free' | 'channel' | 'thread';
    channelId?: string;
    threadRootId?: string;
  };
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiAskRequestDto {
  threadId: string;
  message: string;
}

export interface AiContextRangeDto {
  fromMessageId: string;
  toMessageId: string;
  messageCount: number;
  topicDetected: boolean;
}

export interface AiMessageMetadataDto {
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  modelVersion: string;
  contextRange: AiContextRangeDto;
}

export interface AiMessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: AiMessageMetadataDto | null;
  createdAt: string;
}

export interface CopilotCreateMessageResult {
  threadId: string;
  userMessageId: string;
  assistantMessageId: string;
  assistantContent: string;
  fallbackUsed: boolean;
}

export const getTextFromQuillBody = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { ops?: Array<{ insert?: unknown }> };

    if (!Array.isArray(parsed.ops)) return '';

    return parsed.ops
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .trim();
  } catch {
    return '';
  }
};
