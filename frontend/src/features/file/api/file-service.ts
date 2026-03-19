import { create } from "@bufbuild/protobuf";
import { toGrpcClientError } from "@/lib/grpc/error";
import {
  AbortUploadRequestSchema,
  CompleteUploadRequestSchema,
  CreateUploadSessionRequestSchema,
  GetDownloadUrlRequestSchema,
} from "@/gen/chatapp/file/v1/file_service_pb";
import { fileClient } from "./file-client";
import type {
  AbortUploadInput,
  CompleteUploadInput,
  CompleteUploadResult,
  CreateUploadSessionInput,
  CreateUploadSessionResult,
  GetDownloadUrlInput,
  GetDownloadUrlResult,
} from "../model/file-types";
import {
  mapCompleteUploadResponse,
  mapCreateUploadSessionResponse,
  mapGetDownloadUrlResponse,
} from "../utils/file-mapper";

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

export const fileService = {
  async createUploadSession(
    input: CreateUploadSessionInput,
  ): Promise<CreateUploadSessionResult> {
    try {
      const response = await fileClient.createUploadSession(
        create(CreateUploadSessionRequestSchema, {
          workspaceId: input.workspaceId,
          fileName: input.fileName,
          contentType: input.contentType,
          fileSize: input.fileSize,
          checksumSha256: input.checksumSha256 ?? "",
          clientRequestId:
            input.clientRequestId ?? createClientRequestId("upload"),
        }),
      );

      return mapCreateUploadSessionResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async completeUpload(
    input: CompleteUploadInput,
  ): Promise<CompleteUploadResult> {
    try {
      const response = await fileClient.completeUpload(
        create(CompleteUploadRequestSchema, {
          fileId: input.fileId,
        }),
      );

      return mapCompleteUploadResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async abortUpload(input: AbortUploadInput): Promise<void> {
    try {
      await fileClient.abortUpload(
        create(AbortUploadRequestSchema, {
          fileId: input.fileId,
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getDownloadUrl(
    input: GetDownloadUrlInput,
  ): Promise<GetDownloadUrlResult> {
    try {
      const response = await fileClient.getDownloadUrl(
        create(GetDownloadUrlRequestSchema, {
          fileId: input.fileId,
        }),
      );

      return mapGetDownloadUrlResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};