import { useCallback } from 'react';

import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

import { workspaceService } from './workspace-service';

interface UseGetWorkspaceProps {
  id: Id<'workspaces'>;
}

export const useGetWorkspace = ({ id }: UseGetWorkspaceProps) => {
  const queryFn = useCallback(async () => {
    try {
      const workspace = await workspaceService.getWorkspace({ workspaceId: id });

      if (!workspace) {
        return null;
      }

      return {
        _id: workspace.id as Id<'workspaces'>,
        _creationTime: 0,
        name: workspace.name,
        joinCode: (workspace.slug || workspace.id).toUpperCase(),
      };
    } catch {
      return null;
    }
  }, [id]);

  return useMockQuery(queryFn);
};
