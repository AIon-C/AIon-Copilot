import { useCallback } from 'react';

import { getCurrentUser } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';

export const useCurrentUser = () => {
  const queryFn = useCallback(() => getCurrentUser(), []);

  return useMockQuery(queryFn);
};
