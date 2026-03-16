import { removeChannel } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'channels'>;
};

type ResponseType = Id<'channels'> | null;

export const useRemoveChannel = () => {
  return useMockMutation<RequestType, ResponseType>((values) => removeChannel(values));
};
