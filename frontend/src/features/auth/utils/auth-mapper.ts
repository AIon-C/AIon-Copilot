import type {
  LogInResponse,
  RefreshTokenResponse,
  SignUpResponse,
} from "@/gen/chatapp/auth/v1/auth_service_pb";
import type { User } from "@/gen/chatapp/model/v1/user_pb";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { AuthResult, AuthTokens, AuthUser } from "../model/auth-types";

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

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

export function mapAuthUser(user?: User): AuthUser | null {
  if (!user) {
    return null;
  }

  const raw = user as Record<string, unknown>;
  const displayName = raw.displayName ?? raw.name;
  const avatar = raw.avatarUrl ?? raw.imageUrl ?? raw.iconUrl;

  return {
    id: asString(raw.id),
    email: asString(raw.email),
    displayName: asString(displayName),
    avatarUrl: avatar == null ? null : asString(avatar),
    raw: user,
  };
}

type ProtoTokenSource =
  | Pick<SignUpResponse, "accessToken" | "refreshToken" | "expiresAt">
  | Pick<LogInResponse, "accessToken" | "refreshToken" | "expiresAt">
  | Pick<RefreshTokenResponse, "accessToken" | "refreshToken" | "expiresAt">;

export function mapAuthTokens(input: ProtoTokenSource): AuthTokens {
  return {
    accessToken: input.accessToken || null,
    refreshToken: input.refreshToken || null,
    expiresAt: toDate(input.expiresAt),
  };
}

export function mapAuthResponse(
  response: SignUpResponse | LogInResponse,
): AuthResult {
  return {
    user: mapAuthUser(response.user),
    tokens: mapAuthTokens(response),
  };
}

export function mapRefreshResponse(
  response: RefreshTokenResponse,
  fallbackRefreshToken: string | null,
): AuthTokens {
  const tokens = mapAuthTokens(response);

  return {
    ...tokens,
    refreshToken: tokens.refreshToken || fallbackRefreshToken,
  };
}