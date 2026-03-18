export type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  raw?: unknown;
};

export type AuthResult = {
  user: AuthUser | null;
  tokens: AuthTokens;
};

export type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  initialized: boolean;
};

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
  clientRequestId?: string;
};

export type LogInInput = {
  email: string;
  password: string;
};

export type RefreshInput = {
  refreshToken?: string;
};

export function emptyAuthTokens(): AuthTokens {
  return {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };
}

export function emptyAuthState(): AuthState {
  return {
    user: null,
    tokens: emptyAuthTokens(),
    isAuthenticated: false,
    isRefreshing: false,
    initialized: true,
  };
}