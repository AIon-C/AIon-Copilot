import { copilotApiConfig } from '@/config';
import { tokenStore } from '@/lib/auth/token-store';
import type { Id } from '@/mock/types';

import type { AiAskRequestDto, AiMessageDto, AiThreadDto, CopilotApiMode, CopilotCreateMessageResult } from './copilot-contract';

interface CopilotApiErrorBody {
  message?: string;
  error?: string;
}

export class CopilotApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CopilotApiError';
    this.status = status;
  }
}

type InMemoryThread = {
  id: string;
  workspaceId: string;
  title: string;
  scope: {
    type: 'free' | 'channel' | 'thread';
    channelId?: string;
    threadRootId?: string;
  };
  createdAt: string;
  updatedAt: string;
  messages: AiMessageDto[];
};

const MAX_IN_MEMORY_THREADS = 1000;

class BoundedThreadMap extends Map<string, InMemoryThread> {
  private readonly maxSize: number;

  constructor(maxSize: number) {
    super();
    this.maxSize = maxSize;
  }

  override set(key: string, value: InMemoryThread): this {
    if (!this.has(key) && this.size >= this.maxSize) {
      const firstKey = this.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }
    return super.set(key, value);
  }
}

const inMemoryThreads = new BoundedThreadMap(MAX_IN_MEMORY_THREADS);

const STUB_ASSISTANT_REPLY = 'これはstub応答です。実APIが未稼働または利用不可のため、仕様書準拠の固定応答を返しています。';
const MOCK_ASSISTANT_REPLY =
  'これはCopilotのデモです。実際のCopilotは、コードの提案や質問への回答など、さまざまな機能を提供します。何か質問がありますか？';

let threadSeq = 1;
let messageSeq = 1;

const nowIso = () => new Date().toISOString();

const buildId = (prefix: string, seq: number) => `${prefix}-${seq}`;

const buildThreadScope = ({
  channelId,
  threadRootId,
}: {
  channelId?: string;
  threadRootId?: string;
}): {
  type: 'free' | 'channel' | 'thread';
  channelId?: string;
  threadRootId?: string;
} => {
  if (channelId && threadRootId) {
    return {
      type: 'thread',
      channelId,
      threadRootId,
    };
  }

  if (channelId) {
    return {
      type: 'channel',
      channelId,
    };
  }

  return { type: 'free' };
};

const resolveMode = (mode?: CopilotApiMode): CopilotApiMode => mode ?? copilotApiConfig.mode;

const parseTimeoutMs = () => {
  return Number.isFinite(copilotApiConfig.timeoutMs) ? copilotApiConfig.timeoutMs : 15000;
};

const parseErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as CopilotApiErrorBody;
    return body.message ?? body.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const buildProxyAuthHeaders = (): Record<string, string> => {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
};

const requestJson = async <T>(path: string, options: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parseTimeoutMs());

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...buildProxyAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(`/api/copilot${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new CopilotApiError(message, response.status);
    }

    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof CopilotApiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new CopilotApiError('Request timed out.', 408);
    }

    throw new CopilotApiError('Network request failed.', 503);
  } finally {
    clearTimeout(timeout);
  }
};

const requestSse = async (path: string, payload: AiAskRequestDto): Promise<CopilotCreateMessageResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parseTimeoutMs());

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...buildProxyAuthHeaders(),
    };

    const response = await fetch(`/api/copilot${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new CopilotApiError(message, response.status);
    }

    if (!response.body) {
      throw new CopilotApiError('SSE response body is empty.', 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantContent = '';
    let assistantMessageId = buildId('ai-assistant', messageSeq++);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        const dataPrefix = 'data:';
        if (!line.startsWith(dataPrefix)) continue;

        try {
          const jsonText = line.slice(dataPrefix.length).trimStart();
          const event = JSON.parse(jsonText) as { type?: string; content?: string; message?: string; messageId?: string };

          if (event.type === 'text-delta' && typeof event.content === 'string') {
            assistantContent += event.content;
          }

          if (event.type === 'error') {
            throw new CopilotApiError(event.message ?? 'AI response failed.', 500);
          }

          if (event.type === 'done' && event.messageId) {
            assistantMessageId = event.messageId;
          }
        } catch (error) {
          if (error instanceof CopilotApiError) throw error;
        }
      }
    }

    return {
      threadId: payload.threadId,
      userMessageId: buildId('ai-user', messageSeq++),
      assistantMessageId,
      assistantContent: assistantContent.trim(),
      fallbackUsed: false,
    };
  } catch (error) {
    if (error instanceof CopilotApiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new CopilotApiError('Request timed out.', 408);
    }

    throw new CopilotApiError('Network request failed.', 503);
  } finally {
    clearTimeout(timeout);
  }
};

const isRealModeRecoverableError = (error: unknown) => {
  if (!(error instanceof CopilotApiError)) return false;
  return [404, 501, 503].includes(error.status);
};

const ensureInMemoryThread = (threadId: string, workspaceId: string) => {
  const existing = inMemoryThreads.get(threadId);
  if (existing) return existing;

  const now = nowIso();
  const created: InMemoryThread = {
    id: threadId,
    workspaceId,
    title: 'Copilot Chat',
    scope: { type: 'free' },
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  inMemoryThreads.set(threadId, created);
  return created;
};

const createInMemoryThread = ({
  workspaceId,
  title,
  channelId,
  threadRootId,
}: {
  workspaceId: string;
  title: string;
  channelId?: string;
  threadRootId?: string;
}): AiThreadDto => {
  const id = buildId('ai-thread', threadSeq++);
  const now = nowIso();
  const scope = buildThreadScope({ channelId, threadRootId });

  const thread: InMemoryThread = {
    id,
    workspaceId,
    title,
    scope,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  inMemoryThreads.set(id, thread);

  return {
    id,
    workspaceId,
    userId: 'mock-user',
    title,
    scope,
    model: 'gpt-4.1-mini',
    createdAt: now,
    updatedAt: now,
  };
};

const pushInMemoryMessages = ({
  threadId,
  workspaceId,
  prompt,
  assistantReply,
}: {
  threadId: string;
  workspaceId: string;
  prompt: string;
  assistantReply: string;
}) => {
  const thread = ensureInMemoryThread(threadId, workspaceId);

  const userMessageId = buildId('ai-user', messageSeq++);
  const assistantMessageId = buildId('ai-assistant', messageSeq++);

  thread.messages.push(
    {
      id: userMessageId,
      role: 'user',
      content: prompt,
      metadata: null,
      createdAt: nowIso(),
    },
    {
      id: assistantMessageId,
      role: 'assistant',
      content: assistantReply,
      metadata: {
        inputTokens: Math.max(1, Math.ceil(prompt.length / 4)),
        outputTokens: Math.max(1, Math.ceil(assistantReply.length / 4)),
        latencyMs: 450,
        modelVersion: 'stub-model-v1',
        contextRange: {
          fromMessageId: userMessageId,
          toMessageId: assistantMessageId,
          messageCount: thread.messages.length + 2,
          topicDetected: false,
        },
      },
      createdAt: nowIso(),
    },
  );
  thread.updatedAt = nowIso();

  return {
    threadId,
    userMessageId,
    assistantMessageId,
    assistantContent: assistantReply,
    fallbackUsed: false,
  };
};

export const createCopilotThread = async ({
  workspaceId,
  title,
  channelId,
  threadRootId,
  mode,
}: {
  workspaceId: Id<'workspaces'>;
  title: string;
  channelId?: Id<'channels'>;
  threadRootId?: Id<'messages'>;
  mode?: CopilotApiMode;
}): Promise<AiThreadDto> => {
  const resolvedMode = resolveMode(mode);

  if (resolvedMode === 'mock' || resolvedMode === 'stub') {
    return createInMemoryThread({ workspaceId, title, channelId, threadRootId });
  }

  try {
    return await requestJson<AiThreadDto>('/api/ai/threads', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, title, channelId, threadRootId }),
    });
  } catch (error) {
    if (isRealModeRecoverableError(error)) {
      return createInMemoryThread({ workspaceId, title, channelId, threadRootId });
    }
    throw error;
  }
};

export const sendCopilotMessage = async ({
  threadId,
  workspaceId,
  prompt,
  mode,
}: {
  threadId: string;
  workspaceId: Id<'workspaces'>;
  prompt: string;
  mode?: CopilotApiMode;
}): Promise<CopilotCreateMessageResult> => {
  const resolvedMode = resolveMode(mode);

  if (resolvedMode === 'mock') {
    return pushInMemoryMessages({
      threadId,
      workspaceId,
      prompt,
      assistantReply: MOCK_ASSISTANT_REPLY,
    });
  }

  if (resolvedMode === 'stub') {
    return pushInMemoryMessages({
      threadId,
      workspaceId,
      prompt,
      assistantReply: STUB_ASSISTANT_REPLY,
    });
  }

  try {
    return await requestSse('/api/ai/ask', { threadId, message: prompt });
  } catch (error) {
    if (!isRealModeRecoverableError(error)) throw error;

    const fallbackResult = pushInMemoryMessages({
      threadId,
      workspaceId,
      prompt,
      assistantReply: STUB_ASSISTANT_REPLY,
    });

    return {
      ...fallbackResult,
      fallbackUsed: true,
    };
  }
};

export const getCopilotUserErrorMessage = (error: unknown) => {
  if (error instanceof CopilotApiError) {
    if (error.status === 401 || error.status === 403) {
      return '認証に失敗しました。再ログイン後にもう一度お試しください。';
    }

    if (error.status === 429) {
      return 'リクエストが多すぎます。少し待ってから再試行してください。';
    }

    if (error.status >= 500) {
      return 'サーバーで問題が発生しました。時間をおいて再試行してください。';
    }

    return error.message;
  }

  return 'メッセージ送信に失敗しました。';
};
