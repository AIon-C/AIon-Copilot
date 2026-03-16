import { removeMember } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'members'>;
};

type ResponseType = Id<'members'> | null;

export const useRemoveMember = () => {
  return useMockMutation<RequestType, ResponseType>((values) => removeMember(values));
};
