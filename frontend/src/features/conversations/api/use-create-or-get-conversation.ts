import { createOrGetConversation } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  workspaceId: Id<'workspaces'>;
  memberId: Id<'members'>;
};

type ResponseType = Id<'conversations'> | null;

export const useCreateOrGetConversation = () => {
  return useMockMutation<RequestType, ResponseType>((values) => createOrGetConversation(values));
};
