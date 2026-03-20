export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
};

type StoredTokenSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
};

const TOKEN_STORAGE_KEY = 'chatapp.auth.tokens';

const emptyTokens = (): StoredTokens => ({
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
});

let tokens: StoredTokens = emptyTokens();
let hydrated = false;

function parseSnapshot(snapshot: unknown): StoredTokens {
  if (!snapshot || typeof snapshot !== 'object') {
    return emptyTokens();
  }

  const record = snapshot as Partial<StoredTokenSnapshot>;
  const expiresAt = typeof record.expiresAt === 'string' ? new Date(record.expiresAt) : null;

  return {
    accessToken: typeof record.accessToken === 'string' ? record.accessToken : null,
    refreshToken: typeof record.refreshToken === 'string' ? record.refreshToken : null,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
  };
}

function readFromStorage(): StoredTokens {
  if (typeof window === 'undefined') {
    return emptyTokens();
  }

  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!raw) {
      return emptyTokens();
    }

    return parseSnapshot(JSON.parse(raw));
  } catch {
    return emptyTokens();
  }
}

function writeToStorage(next: StoredTokens): void {
  if (typeof window === 'undefined') {
    return;
  }

  const hasToken = Boolean(next.accessToken || next.refreshToken);

  if (!hasToken) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  const snapshot: StoredTokenSnapshot = {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    expiresAt: next.expiresAt ? next.expiresAt.toISOString() : null,
  };

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(snapshot));
}

function ensureHydrated(): void {
  if (hydrated) {
    return;
  }

  hydrated = true;
  tokens = readFromStorage();
}

export const tokenStore = {
  getAccessToken(): string | null {
    ensureHydrated();
    return tokens.accessToken;
  },

  getRefreshToken(): string | null {
    ensureHydrated();
    return tokens.refreshToken;
  },

  getExpiresAt(): Date | null {
    ensureHydrated();
    return tokens.expiresAt;
  },

  getTokens(): StoredTokens {
    ensureHydrated();
    return { ...tokens };
  },

  setTokens(next: Partial<StoredTokens>): StoredTokens {
    ensureHydrated();
    tokens = {
      ...tokens,
      ...next,
    };
    writeToStorage(tokens);
    return { ...tokens };
  },

  replaceTokens(next: StoredTokens): StoredTokens {
    ensureHydrated();
    tokens = { ...next };
    writeToStorage(tokens);
    return { ...tokens };
  },

  clear(): void {
    ensureHydrated();
    tokens = emptyTokens();
    writeToStorage(tokens);
  },

  hasAccessToken(): boolean {
    ensureHydrated();
    return Boolean(tokens.accessToken);
  },
};
