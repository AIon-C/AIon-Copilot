import { useCallback } from 'react';

import { getMessageById } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetMessageProps {
  id: Id<'messages'>;
}

export const useGetMessage = ({ id }: UseGetMessageProps) => {
  const queryFn = useCallback(() => getMessageById({ id }), [id]);

  return useMockQuery(queryFn);
};
