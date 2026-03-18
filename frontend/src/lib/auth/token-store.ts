export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
};

const emptyTokens = (): StoredTokens => ({
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
});

let tokens: StoredTokens = emptyTokens();

export const tokenStore = {
  getAccessToken(): string | null {
    return tokens.accessToken;
  },

  getRefreshToken(): string | null {
    return tokens.refreshToken;
  },

  getExpiresAt(): Date | null {
    return tokens.expiresAt;
  },

  getTokens(): StoredTokens {
    return { ...tokens };
  },

  setTokens(next: Partial<StoredTokens>): StoredTokens {
    tokens = {
      ...tokens,
      ...next,
    };
    return { ...tokens };
  },

  replaceTokens(next: StoredTokens): StoredTokens {
    tokens = { ...next };
    return { ...tokens };
  },

  clear(): void {
    tokens = emptyTokens();
  },

  hasAccessToken(): boolean {
    return Boolean(tokens.accessToken);
  },
};
