import { useCallback } from 'react';

import { getWorkspaceInfoById } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetWorkspaceInfoProps {
  id: Id<'workspaces'>;
}

export const useGetWorkspaceInfo = ({ id }: UseGetWorkspaceInfoProps) => {
  const queryFn = useCallback(() => getWorkspaceInfoById(id), [id]);

  return useMockQuery(queryFn);
};
