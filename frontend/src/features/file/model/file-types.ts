export type FileModel = {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  fileSize: number;
  createdAt: Date | null;
  raw?: unknown;
};

export type CreateUploadSessionInput = {
  workspaceId: string;
  fileName: string;
  contentType: string;
  fileSize: bigint;
  checksumSha256?: string;
  clientRequestId?: string;
};

export type CreateUploadSessionResult = {
  uploadUrl: string;
  fileId: string;
  expiresAt: Date | null;
  raw?: unknown;
};

export type CompleteUploadInput = {
  fileId: string;
};

export type AbortUploadInput = {
  fileId: string;
};

export type GetDownloadUrlInput = {
  fileId: string;
};

export type GetDownloadUrlResult = {
  downloadUrl: string;
  expiresAt: Date | null;
  raw?: unknown;
};

export type CompleteUploadResult = FileModel | null;