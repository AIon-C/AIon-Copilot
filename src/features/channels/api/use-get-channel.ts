import { useCallback } from 'react';

import { getChannelById } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetChannelProps {
  id: Id<'channels'>;
}

export const useGetChannel = ({ id }: UseGetChannelProps) => {
  const queryFn = useCallback(() => getChannelById({ id }), [id]);

  return useMockQuery(queryFn);
};
