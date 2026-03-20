import { useCallback } from 'react';

import { getCurrentMember } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseCurrentMemberProps {
  workspaceId: Id<'workspaces'>;
}

export const useCurrentMember = ({ workspaceId }: UseCurrentMemberProps) => {
  const queryFn = useCallback(() => getCurrentMember({ workspaceId }), [workspaceId]);

  return useMockQuery(queryFn);
};
