import { fileService } from '@/features/file/api/file-service';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  workspaceId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
};

type ResponseType = {
  uploadUrl: string;
  fileId: string;
} | null;

export const useGenerateUploadUrl = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const session = await fileService.createUploadSession({
      workspaceId: values.workspaceId,
      fileName: values.fileName,
      contentType: values.contentType,
      fileSize: BigInt(values.fileSize),
    });

    return {
      uploadUrl: session.uploadUrl,
      fileId: session.fileId,
    };
  });
};
