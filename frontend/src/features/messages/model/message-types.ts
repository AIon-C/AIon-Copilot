import type { GetMessageResponse, ListMessagesRequest, ListMessagesResponse } from '@/gen/chatapp/message/v1/message_service_pb';

export type MessageModel = {
  id: string;
  channelId: string;
  userId: string;
  threadRootId: string | null;
  content: string;
  isEdited: boolean;
  metadata?: unknown;
  editedAt: Date | null;
  raw?: unknown;
};

export type ListMessagesInput = {
  channelId: string;
  page?: ListMessagesRequest['page'];
};

export type ListMessagesResult = {
  messages: MessageModel[];
  page?: ListMessagesResponse['page'];
  raw?: unknown;
};

export type GetMessageInput = {
  messageId: string;
};

export type SendMessageInput = {
  channelId: string;
  content: string;
  fileIds?: string[];
  clientMessageId?: string;
  threadRootId?: string;
};

export type UpdateMessageInput = {
  id: string;
  content?: string;
};

export type DeleteMessageInput = {
  messageId: string;
};

export type SendTypingIndicatorInput = {
  channelId: string;
  threadRootId?: string;
};

export type GetMessageResult = MessageModel | null;
export type SendMessageResult = MessageModel | null;
export type UpdateMessageResult = MessageModel | null;
export type DeleteMessageResult = MessageModel | null;

export type RawGetMessageResponse = GetMessageResponse;
