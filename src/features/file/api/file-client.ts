import { FileService } from '@/gen/chatapp/file/v1/file_service_pb';
import { createApiClient } from '@/lib/grpc/base-client';

export const fileClient = createApiClient(FileService);
