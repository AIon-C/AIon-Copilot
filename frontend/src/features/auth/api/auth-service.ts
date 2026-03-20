import { create } from '@bufbuild/protobuf';
import { Code } from '@connectrpc/connect';

import {
  LogInRequestSchema,
  LogoutRequestSchema,
  RefreshTokenRequestSchema,
  SignUpRequestSchema,
} from '@/gen/chatapp/auth/v1/auth_service_pb';
import { authSession } from '@/lib/auth/auth-session';
import { tokenStore } from '@/lib/auth/token-store';
import { toGrpcClientError } from '@/lib/grpc/error';

import { authStore } from '../model/auth-store';
import { AuthResult, AuthTokens, LogInInput, RefreshInput, SignUpInput } from '../model/auth-types';
import { mapAuthResponse, mapRefreshResponse } from '../utils/auth-mapper';
import { authClient } from './auth-client';

function persistTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (tokens.accessToken) {
    localStorage.setItem('accessToken', tokens.accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }

  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

function clearPersistedTokens(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function createClientReqeustId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `signup-${Date.now()}`;
}

function applyAuthResult(result: AuthResult): AuthResult {
  tokenStore.replaceTokens(result.tokens);
  persistTokens(result.tokens);
  authStore.setSession(result);
  return result;
}

function applyAuthTokens(tokens: AuthTokens): AuthTokens {
  tokenStore.replaceTokens(tokens);
  persistTokens(tokens);
  authStore.setTokens(tokens);
  return tokens;
}

function clearLocalAuth(): void {
  clearPersistedTokens();
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
      throw toGrpcClientError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await authClient.logout(create(LogoutRequestSchema, {}));
      clearLocalAuth();
    } catch (error) {
      const grpcError = toGrpcClientError(error);

      if (grpcError.code === Code.Unauthenticated) {
        clearLocalAuth();
      }

      throw grpcError;
    }
  },

  async refresh(input?: RefreshInput): Promise<AuthTokens> {
    return authSession.runRefreshSingleFlight(async () => {
      const currentTokens = tokenStore.getTokens();
      const refreshToken = input?.refreshToken ?? currentTokens.refreshToken;

      if (!refreshToken) {
        clearLocalAuth();
        throw new Error('Refresh token is missing');
      }

      authStore.setRefreshing(true);

      try {
        const response = await authClient.refreshToken(
          create(RefreshTokenRequestSchema, {
            refreshToken,
          }),
        );

        const nextTokens = mapRefreshResponse(response, currentTokens.refreshToken);

        return applyAuthTokens(nextTokens);
      } catch (error) {
        const grpcError = toGrpcClientError(error);

        if (grpcError.code === Code.Unauthenticated) {
          clearLocalAuth();
        }

        throw grpcError;
      } finally {
        authStore.setRefreshing(false);
      }
    });
  },

  clearLocalAuth,
};
