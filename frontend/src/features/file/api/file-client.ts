import { createApiClient } from "@/lib/grpc/base-client";
import { FileService } from "@/gen/chatapp/file/v1/file_service_pb";

export const fileClient = createApiClient(FileService);