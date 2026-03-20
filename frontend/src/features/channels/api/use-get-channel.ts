import { useCallback } from 'react';

import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

import { channelService } from './channel-service';

interface UseGetChannelProps {
  id: Id<'channels'>;
}

export const useGetChannel = ({ id }: UseGetChannelProps) => {
  const queryFn = useCallback(async () => {
    try {
      const channel = await channelService.getChannel({ channelId: id });

      if (!channel) {
        return null;
      }

      return {
        _id: channel.id as Id<'channels'>,
        _creationTime: 0,
        name: channel.name,
        workspaceId: channel.workspaceId as Id<'workspaces'>,
      };
    } catch {
      return null;
    }
  }, [id]);

  return useMockQuery(queryFn);
};
