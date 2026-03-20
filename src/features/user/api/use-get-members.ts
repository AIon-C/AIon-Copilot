import { useCallback } from 'react';

import { getMembers } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetMembersProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
  const queryFn = useCallback(() => getMembers({ workspaceId }), [workspaceId]);

  return useMockQuery(queryFn);
};
