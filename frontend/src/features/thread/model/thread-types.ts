import type { MessageModel } from '@/features/message/model/message-types';

export type ThreadModel = {
  rootMessage: MessageModel | null;
  replies: MessageModel[];
  raw?: unknown;
};

export type GetThreadInput = {
  threadRootId: string;
};

export type GetThreadResult = ThreadModel;
