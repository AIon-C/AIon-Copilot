import { tokenStore } from "@/lib/auth/token-store";
import { AuthResult, AuthTokens, LogInInput, RefreshInput, SignUpInput } from "../model/auth-types";
import { authStore } from "../model/auth-store";
import { authSession } from "@/lib/auth/auth-session";
import { authClient } from "./auth-client";
import { create } from "@bufbuild/protobuf";
import { LogInRequestSchema, RefreshTokenRequestSchema, SignUpRequestSchema } from "@/gen/chatapp/auth/v1/auth_service_pb";
import { mapAuthResponse, mapRefreshResponse } from "../utils/auth-mapper";
import { toGrpcClientError } from "@/lib/grpc/error";
import { Code } from "@connectrpc/connect";

function createClientReqeustId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `signup-${Date.now()}`;
}

function applyAuthResult(result: AuthResult): AuthResult {
  tokenStore.replaceTokens(result.tokens);
  authStore.setSession(result);
  return result;
}

function applyAuthTokens(tokens: AuthTokens): AuthTokens {
  tokenStore.replaceTokens(tokens);
  authStore.setTokens(tokens);
  return tokens;
}

function clearLocalAuth(): void {
  tokenStore.clear();
  authSession.clear();
  authStore.clear();
}

export const authService = {
  async signUp(input: SignUpInput): Promise<AuthResult> {
    try {
      const response = await authClient.signUp(
        create(SignUpRequestSchema, {
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          clientRequestId: input.clientRequestId ?? createClientReqeustId(),
        }),
      );

      return applyAuthResult(mapAuthResponse(response));
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async logIn(input: LogInInput): Promise<AuthResult> {
    try {
      const response = await authClient.logIn(
        create(LogInRequestSchema, {
          email: input.email,
          password: input.password,
        }),
      );

      return applyAuthResult(mapAuthResponse(response));
    } catch (error) {
      throw toGrpcClientError(error)
    }
  },

  async refresh(input?: RefreshInput): Promise<AuthTokens> {
    return authSession.runRefreshSingleFlight(async () => {
      const currentTokens = tokenStore.getTokens();
      const refreshToken = input?.refreshToken ?? currentTokens.refreshToken;

      if (!refreshToken) {
        clearLocalAuth();
        throw new Error("Refresh token is missing");
      }

      authStore.setRefreshing(true)

      try {
        const response = await authClient.refreshToken(
          create(RefreshTokenRequestSchema, {
            refreshToken,
          }),
        );

        const nextTokens = mapRefreshResponse(
          response,
          currentTokens.refreshToken,
        );

        return applyAuthTokens(nextTokens);
      } catch (error) {
        const grpcError = toGrpcClientError(error);

        if (grpcError.code === Code.Unauthenticated) {
          clearLocalAuth();
        }

        throw grpcError;
      } finally {
        authStore.setRefreshing(true);
      }
    });
  },

  clearLocalAuth,
};