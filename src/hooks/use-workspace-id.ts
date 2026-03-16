'use client';

import { useParams } from 'next/navigation';

import type { Id } from '@/mock/types';

type WorkspaceIdParams = {
  workspaceId: Id<'workspaces'>;
};

export const useWorkspaceId = () => {
  const params = useParams<WorkspaceIdParams>();

  return params.workspaceId;
};
