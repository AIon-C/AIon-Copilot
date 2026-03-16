import { updateMessage } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  body: string;
  id: Id<'messages'>;
};

type ResponseType = Id<'messages'> | null;

export const useUpdateMessage = () => {
  return useMockMutation<RequestType, ResponseType>((values) => updateMessage(values));
};
