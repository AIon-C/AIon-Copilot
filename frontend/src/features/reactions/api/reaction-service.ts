import { create } from '@bufbuild/protobuf';

import {
  AddReactionRequestSchema,
  ListReactionsRequestSchema,
  RemoveReactionRequestSchema,
} from '@/gen/chatapp/reaction/v1/reaction_service_pb';
import { toGrpcClientError } from '@/lib/grpc/error';

import type {
  AddReactionInput,
  AddReactionResult,
  ListReactionsInput,
  ListReactionsResult,
  RemoveReactionInput,
  RemoveReactionResult,
} from '../model/reaction-types';
import { mapAddReactionResponse, mapListReactionsResponse, mapRemoveReactionResponse } from '../utils/reaction-mapper';
import { reactionClient } from './reaction-client';

export const reactionService = {
  async addReaction(input: AddReactionInput): Promise<AddReactionResult> {
    try {
      const response = await reactionClient.addReaction(
        create(AddReactionRequestSchema, {
          messageId: input.messageId,
          emojiCode: input.emojiCode,
        }),
      );

      return mapAddReactionResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async removeReaction(input: RemoveReactionInput): Promise<RemoveReactionResult> {
    try {
      const response = await reactionClient.removeReaction(
        create(RemoveReactionRequestSchema, {
          messageId: input.messageId,
          emojiCode: input.emojiCode,
        }),
      );

      return mapRemoveReactionResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async listReactions(input: ListReactionsInput): Promise<ListReactionsResult> {
    try {
      const response = await reactionClient.listReactions(
        create(ListReactionsRequestSchema, {
          messageId: input.messageId,
        }),
      );

      return mapListReactionsResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};
