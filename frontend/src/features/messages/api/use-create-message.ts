import { createMessage } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  body: string;
  image?: Id<'_storage'>;
  workspaceId: Id<'workspaces'>;
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
};

type ResponseType = Id<'messages'> | null;

export const useCreateMessage = () => {
  return useMockMutation<RequestType, ResponseType>((values) => createMessage(values));
};
