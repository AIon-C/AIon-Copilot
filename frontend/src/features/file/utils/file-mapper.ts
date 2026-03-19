import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { File } from "@/gen/chatapp/model/v1/file_pb";
import type {
  CompleteUploadResponse,
  CreateUploadSessionResponse,
  GetDownloadUrlResponse,
} from "@/gen/chatapp/file/v1/file_service_pb";
import type {
  CompleteUploadResult,
  CreateUploadSessionResult,
  FileModel,
  GetDownloadUrlResult,
} from "../model/file-types";

function toDate(timestamp?: Timestamp): Date | null {
  if (!timestamp) {
    return null;
  }

  const seconds =
    typeof timestamp.seconds === "bigint"
      ? Number(timestamp.seconds)
      : Number(timestamp.seconds ?? 0);

  const nanos = Number(timestamp.nanos ?? 0);

  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
}

function toNumber(value?: number | bigint): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value ?? 0);
}

export function mapFile(file?: File): FileModel | null {
  if (!file) {
    return null;
  }

  return {
    id: file.id,
    workspaceId: file.workspaceId,
    uploadedBy: file.uploadedBy,
    fileName: file.fileName,
    fileKey: file.fileKey,
    contentType: file.contentType,
    fileSize: toNumber(file.fileSize),
    createdAt: toDate(file.createdAt),
    raw: file,
  };
}

export function mapCreateUploadSessionResponse(
  response: CreateUploadSessionResponse,
): CreateUploadSessionResult {
  return {
    uploadUrl: response.uploadUrl,
    fileId: response.fileId,
    expiresAt: toDate(response.expiresAt),
    raw: response,
  };
}

export function mapCompleteUploadResponse(
  response: CompleteUploadResponse,
): CompleteUploadResult {
  return mapFile(response.file);
}

export function mapGetDownloadUrlResponse(
  response: GetDownloadUrlResponse,
): GetDownloadUrlResult {
  return {
    downloadUrl: response.downloadUrl,
    expiresAt: toDate(response.expiresAt),
    raw: response,
  };
}