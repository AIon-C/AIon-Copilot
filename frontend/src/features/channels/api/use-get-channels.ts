import { useCallback } from 'react';

import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

import { channelService } from './channel-service';

interface UseGetChannelsProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetChannels = ({ workspaceId }: UseGetChannelsProps) => {
  const queryFn = useCallback(async () => {
    try {
      const channels = await channelService.listChannels({ workspaceId });

      return channels.map((channel) => ({
        _id: channel.id as Id<'channels'>,
        _creationTime: 0,
        name: channel.name,
        workspaceId: channel.workspaceId as Id<'workspaces'>,
      }));
    } catch {
      return [];
    }
  }, [workspaceId]);

  return useMockQuery(queryFn);
};
