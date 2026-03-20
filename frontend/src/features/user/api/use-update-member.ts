import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'members'>;
  role: 'admin' | 'member';
};

type ResponseType = Id<'members'> | null;

export const useUpdateMember = () => {
  return useMockMutation<RequestType, ResponseType>(async () => {
    throw new Error('Updating member role is not supported by current gRPC API');
  });
};
