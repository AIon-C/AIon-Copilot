import { removeMessage } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'messages'>;
};

type ResponseType = Id<'messages'> | null;

export const useRemoveMessage = () => {
  return useMockMutation<RequestType, ResponseType>((values) => removeMessage(values));
};
