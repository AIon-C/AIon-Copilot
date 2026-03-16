import { useCallback } from 'react';

import { getWorkspaceById } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetWorkspaceProps {
  id: Id<'workspaces'>;
}

export const useGetWorkspace = ({ id }: UseGetWorkspaceProps) => {
  const queryFn = useCallback(() => getWorkspaceById(id), [id]);

  return useMockQuery(queryFn);
};
