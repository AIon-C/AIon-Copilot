import { useCallback } from 'react';

import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

import { workspaceService } from './workspace-service';

export const useGetWorkspaces = () => {
  const queryFn = useCallback(async () => {
    try {
      const workspaces = await workspaceService.listWorkspaces();

      return workspaces.map((workspace) => ({
        _id: workspace.id as Id<'workspaces'>,
        _creationTime: 0,
        name: workspace.name,
        joinCode: (workspace.slug || workspace.id).toUpperCase(),
      }));
    } catch {
      return [];
    }
  }, []);

  return useMockQuery(queryFn);
};
