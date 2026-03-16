import { useCallback } from 'react';

import { getChannels } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetChannelsProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetChannels = ({ workspaceId }: UseGetChannelsProps) => {
  const queryFn = useCallback(() => getChannels({ workspaceId }), [workspaceId]);

  return useMockQuery(queryFn);
};
