export type ReactionModel = {
  id: string;
  messageId: string;
  userId: string;
  emojiCode: string;
  createdAt: Date | null;
  raw?: unknown;
};

export type AddReactionInput = {
  messageId: string;
  emojiCode: string;
};

export type RemoveReactionInput = {
  messageId: string;
  emojiCode: string;
};

export type RemoveReactionResult = {
  messageId: string;
  raw?: unknown;
};

export type ListReactionsInput = {
  messageId: string;
};

export type AddReactionResult = ReactionModel | null;
export type ListReactionsResult = ReactionModel[];