import type { Timestamp } from '@bufbuild/protobuf/wkt';

import type { Reaction } from '@/gen/chatapp/model/v1/reaction_pb';
import type { AddReactionResponse, ListReactionsResponse, RemoveReactionResponse } from '@/gen/chatapp/reaction/v1/reaction_service_pb';

import type { AddReactionResult, ListReactionsResult, ReactionModel, RemoveReactionResult } from '../model/reaction-types';

function toDate(timestamp?: Timestamp): Date | null {
  if (!timestamp) {
    return null;
  }

  const seconds = typeof timestamp.seconds === 'bigint' ? Number(timestamp.seconds) : Number(timestamp.seconds ?? 0);

  const nanos = Number(timestamp.nanos ?? 0);

  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
}

export function mapReaction(reaction?: Reaction): ReactionModel | null {
  if (!reaction) {
    return null;
  }

  return {
    id: reaction.id,
    messageId: reaction.messageId,
    userId: reaction.userId,
    emojiCode: reaction.emojiCode,
    createdAt: toDate(reaction.createdAt),
    raw: reaction,
  };
}

export function mapAddReactionResponse(response: AddReactionResponse): AddReactionResult {
  return mapReaction(response.reaction);
}

export function mapListReactionsResponse(response: ListReactionsResponse): ListReactionsResult {
  return response.reactions.map((item) => mapReaction(item)).filter((item): item is ReactionModel => item !== null);
}

export function mapRemoveReactionResponse(response: RemoveReactionResponse): RemoveReactionResult {
  return {
    messageId: response.messageId,
    raw: response,
  };
}
