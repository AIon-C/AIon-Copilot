import { Code, ConnectError } from "@connectrpc/connect";

export class GrpcClientError extends Error {
  constructor(
    message: string,
    public readonly code: Code | "unknown" = "unknown",
    public readonly metadata: Record<string, string> = {},
  ) {
    super(message);
    this.name = "GrpcClientError";
  }
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function toGrpcClientError(error: unknown): GrpcClientError {
  if (error instanceof GrpcClientError) {
    return error;
  }

  if (error instanceof ConnectError) {
    return new GrpcClientError(
      error.rawMessage || error.message,
      error.code,
      headersToRecord(error.metadata),
    );
  }

  if (error instanceof Error) {
    return new GrpcClientError(error.message);
  }

  return new GrpcClientError("Unknown gRPC error");
}

export function isGrpcCode(
  error: unknown,
  code: Code,
): boolean {
  if (error instanceof ConnectError) {
    return error.code === code;
  }

  if (error instanceof GrpcClientError) {
    return error.code === code;
  }

  return false;
}