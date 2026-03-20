import type { Timestamp } from '@bufbuild/protobuf/wkt';

import type {
  DeleteMessageResponse,
  GetMessageResponse,
  ListMessagesResponse,
  SendMessageResponse,
  UpdateMessageResponse,
} from '@/gen/chatapp/message/v1/message_service_pb';
import type { Message } from '@/gen/chatapp/model/v1/message_pb';

import type {
  DeleteMessageResult,
  GetMessageResult,
  ListMessagesResult,
  MessageModel,
  SendMessageResult,
  UpdateMessageResult,
} from '../model/message-types';

function toDate(timestamp?: Timestamp): Date | null {
  if (!timestamp) {
    return null;
  }

  const seconds = typeof timestamp.seconds === 'bigint' ? Number(timestamp.seconds) : Number(timestamp.seconds ?? 0);

  const nanos = Number(timestamp.nanos ?? 0);

  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
}

export function mapMessage(message?: Message): MessageModel | null {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    channelId: message.channelId,
    userId: message.userId,
    threadRootId: message.threadRootId || null,
    content: message.content,
    isEdited: message.isEdited,
    metadata: message.metadata,
    editedAt: toDate(message.editedAt),
    raw: message,
  };
}

export function mapMessages(response: ListMessagesResponse): ListMessagesResult {
  return {
    messages: response.messages.map((item) => mapMessage(item)).filter((item): item is MessageModel => item !== null),
    page: response.page,
    raw: response,
  };
}

export function mapGetMessageResponse(response: GetMessageResponse): GetMessageResult {
  return mapMessage(response.message);
}

export function mapSendMessageResponse(response: SendMessageResponse): SendMessageResult {
  return mapMessage(response.message);
}

export function mapUpdateMessageResponse(response: UpdateMessageResponse): UpdateMessageResult {
  return mapMessage(response.message);
}

export function mapDeleteMessageResponse(response: DeleteMessageResponse): DeleteMessageResult {
  return mapMessage(response.message);
}
