import { updateChannel } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  name: string;
  id: Id<'channels'>;
};

type ResponseType = Id<'channels'> | null;

export const useUpdateChannel = () => {
  return useMockMutation<RequestType, ResponseType>((values) => updateChannel(values));
};
