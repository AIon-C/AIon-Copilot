import { useCallback } from 'react';

import { getWorkspaces } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';

export const useGetWorkspaces = () => {
  const queryFn = useCallback(() => getWorkspaces(), []);

  return useMockQuery(queryFn);
};
