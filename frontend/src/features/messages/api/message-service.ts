import { create } from "@bufbuild/protobuf";
import { toGrpcClientError } from "@/lib/grpc/error";
import {
  DeleteMessageRequestSchema,
  GetMessageRequestSchema,
  ListMessagesRequestSchema,
  SendMessageRequestSchema,
  SendTypingIndicatorRequestSchema,
  UpdateMessageRequestSchema,
} from "@/gen/chatapp/message/v1/message_service_pb";
import { messageClient } from "./message-client";
import type {
  DeleteMessageInput,
  DeleteMessageResult,
  GetMessageInput,
  GetMessageResult,
  ListMessagesInput,
  ListMessagesResult,
  SendMessageInput,
  SendMessageResult,
  SendTypingIndicatorInput,
  UpdateMessageInput,
  UpdateMessageResult,
} from "../model/message-types";
import {
  mapDeleteMessageResponse,
  mapGetMessageResponse,
  mapMessages,
  mapSendMessageResponse,
  mapUpdateMessageResponse,
} from "../utils/message-mapper";

function createClientMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function buildMessageUpdateMaskPaths(input: UpdateMessageInput): string[] {
  const paths: string[] = [];

  if (input.content !== undefined) {
    paths.push("content");
  }

  return paths;
}

export const messageService = {
  async listMessages(input: ListMessagesInput): Promise<ListMessagesResult> {
    try {
      const response = await messageClient.listMessages(
        create(ListMessagesRequestSchema, {
          channelId: input.channelId,
          page: input.page,
        }),
      );

      return mapMessages(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getMessage(input: GetMessageInput): Promise<GetMessageResult> {
    try {
      const response = await messageClient.getMessage(
        create(GetMessageRequestSchema, {
          messageId: input.messageId,
        }),
      );

      return mapGetMessageResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    try {
      const response = await messageClient.sendMessage(
        create(SendMessageRequestSchema, {
          channelId: input.channelId,
          content: input.content,
          fileIds: input.fileIds ?? [],
          clientMessageId:
            input.clientMessageId ?? createClientMessageId("message"),
          ...(input.threadRootId !== undefined
            ? { threadRootId: input.threadRootId }
            : {}),
        }),
      );

      return mapSendMessageResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async updateMessage(input: UpdateMessageInput): Promise<UpdateMessageResult> {
    const paths = buildMessageUpdateMaskPaths(input);

    if (paths.length === 0) {
      throw new Error("No message fields to update");
    }

    try {
      const response = await messageClient.updateMessage(
        create(UpdateMessageRequestSchema, {
          message: {
            id: input.id,
            ...(input.content !== undefined ? { content: input.content } : {}),
          },
          updateMask: {
            paths,
          },
        }),
      );

      return mapUpdateMessageResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async deleteMessage(input: DeleteMessageInput): Promise<DeleteMessageResult> {
    try {
      const response = await messageClient.deleteMessage(
        create(DeleteMessageRequestSchema, {
          messageId: input.messageId,
        }),
      );

      return mapDeleteMessageResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async sendTypingIndicator(input: SendTypingIndicatorInput): Promise<void> {
    try {
      await messageClient.sendTypingIndicator(
        create(SendTypingIndicatorRequestSchema, {
          channelId: input.channelId,
          ...(input.threadRootId !== undefined
            ? { threadRootId: input.threadRootId }
            : {}),
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};