import { toggleReaction } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  value: string;
  messageId: Id<'messages'>;
};

type ResponseType = Id<'reactions'> | null;

export const useToggleReaction = () => {
  return useMockMutation<RequestType, ResponseType>((values) => toggleReaction(values));
};
