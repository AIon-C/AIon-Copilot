import { useCallback } from 'react';

import { getMemberById } from '@/mock/api';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

interface UseGetMemberProps {
  id: Id<'members'>;
}

export const useGetMember = ({ id }: UseGetMemberProps) => {
  const queryFn = useCallback(() => getMemberById({ id }), [id]);

  return useMockQuery(queryFn);
};
