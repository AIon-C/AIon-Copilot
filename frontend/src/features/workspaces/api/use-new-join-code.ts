import { generateNewJoinCode } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  workspaceId: Id<'workspaces'>;
};

type ResponseType = Id<'workspaces'> | null;

export const useNewJoinCode = () => {
  return useMockMutation<RequestType, ResponseType>((values) => generateNewJoinCode(values));
};
