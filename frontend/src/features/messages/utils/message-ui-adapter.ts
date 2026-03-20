import type { MessageModel } from '../model/message-types';

type MemberContext = {
  memberId: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  image?: string;
};

type ProtoTimestamp = {
  seconds?: number | bigint;
  nanos?: number;
};

function toMillis(value?: Date | ProtoTimestamp | null): number {
  if (!value) {
    return Date.now();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const secondsRaw = value.seconds ?? 0;
  const seconds = typeof secondsRaw === 'bigint' ? Number(secondsRaw) : Number(secondsRaw);
  const nanos = Number(value.nanos ?? 0);

  return seconds * 1000 + Math.floor(nanos / 1_000_000);
}

function toQuillBody(content: string): string {
  try {
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }

    if (parsed && typeof parsed === 'object' && 'ops' in parsed) {
      return JSON.stringify(parsed);
    }
  } catch {
    // Fallback below handles plain text payloads.
  }

  return JSON.stringify([{ insert: `${content}\n` }]);
}

export type UiMessage = {
  _id: string;
  _creationTime: number;
  body: string;
  image?: string | null;
  updatedAt?: number;
  memberId: string;
  user: {
    _id: string;
    name: string;
    image?: string;
  };
  reactions: Array<{
    _id: string;
    _creationTime: number;
    value: string;
    count: number;
    memberIds: string[];
  }>;
  workspaceId: string;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  threadCount?: number;
  threadImage?: string;
  threadName?: string;
  threadTimestamp?: number;
};

export function toUiMessage(
  message: MessageModel,
  options?: {
    workspaceId?: string;
    membersByUserId?: Record<string, MemberContext>;
    reactionsByMessageId?: Record<
      string,
      Array<{
        _id: string;
        _creationTime: number;
        value: string;
        count: number;
        memberIds: string[];
      }>
    >;
  },
): UiMessage {
  const rawMetadata = (message.raw as { metadata?: { createdAt?: ProtoTimestamp; updatedAt?: ProtoTimestamp } } | undefined)?.metadata;
  const createdAt = toMillis(rawMetadata?.createdAt ?? null);
  const updatedAt = toMillis(message.editedAt ?? rawMetadata?.updatedAt ?? null);
  const member = options?.membersByUserId?.[message.userId];
  const userName = member?.name ?? `User ${message.userId.slice(0, 6) || 'unknown'}`;
  const memberId = member?.memberId ?? message.userId;

  return {
    _id: message.id,
    _creationTime: createdAt,
    body: toQuillBody(message.content),
    image: null,
    updatedAt: message.isEdited ? updatedAt : undefined,
    memberId,
    user: {
      _id: message.userId,
      name: userName,
      image: member?.image,
    },
    reactions: options?.reactionsByMessageId?.[message.id] ?? [],
    workspaceId: options?.workspaceId ?? '',
    channelId: message.channelId || undefined,
    conversationId: undefined,
    parentMessageId: message.threadRootId || undefined,
    threadCount: undefined,
    threadImage: undefined,
    threadName: undefined,
    threadTimestamp: undefined,
  };
}
