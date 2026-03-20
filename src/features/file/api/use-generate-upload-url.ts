import { generateUploadUrl } from '@/mock/api';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = Record<string, never>;
type ResponseType = string | null;

export const useGenerateUploadUrl = () => {
  return useMockMutation<RequestType, ResponseType>(() => generateUploadUrl());
};
