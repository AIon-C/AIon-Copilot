import { createChannel } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  name: string;
  workspaceId: Id<'workspaces'>;
};

type ResponseType = Id<'channels'> | null;

export const useCreateChannel = () => {
  return useMockMutation<RequestType, ResponseType>((values) => createChannel(values));
};
