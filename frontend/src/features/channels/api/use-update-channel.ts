import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { channelService } from './channel-service';

type RequestType = {
  name: string;
  id: Id<'channels'>;
};

type ResponseType = Id<'channels'> | null;

export const useUpdateChannel = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const channel = await channelService.updateChannel(values);
    return (channel?.id as Id<'channels'> | undefined) ?? null;
  });
};
