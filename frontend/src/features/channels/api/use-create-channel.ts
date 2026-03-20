import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { channelService } from './channel-service';

type RequestType = {
  name: string;
  workspaceId: Id<'workspaces'>;
};

type ResponseType = Id<'channels'> | null;

export const useCreateChannel = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const channel = await channelService.createChannel(values);
    return (channel?.id as Id<'channels'> | undefined) ?? null;
  });
};
