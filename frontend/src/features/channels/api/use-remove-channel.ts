import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { channelService } from './channel-service';

type RequestType = {
  id: Id<'channels'>;
};

type ResponseType = Id<'channels'> | null;

export const useRemoveChannel = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    await channelService.leaveChannel({ channelId: values.id });
    return values.id;
  });
};
