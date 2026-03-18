import type {
  AuthResult,
  AuthState,
  AuthTokens,
  AuthUser,
} from "./auth-types";
import { emptyAuthState } from "./auth-types";

type Listener = () => void;

let state: AuthState = emptyAuthState();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setState(
    updater:
      | Partial<AuthState>
      | ((prev: AuthState) => Partial<AuthState> | AuthState),
  ): void {
    const next =
      typeof updater === "function" ? updater(state) : updater;

    state = {
      ...state,
      ...next,
      tokens: {
        ...state.tokens,
        ...(next.tokens ?? {}),
      },
    };

    emit();
  },

  setSession(result: AuthResult): void {
    state = {
      ...state,
      user: result.user,
      tokens: result.tokens,
      isAuthenticated: Boolean(result.tokens.accessToken),
      initialized: true,
    };
    emit();
  },

  setTokens(tokens: AuthTokens): void {
    state = {
      ...state,
      tokens,
      isAuthenticated: Boolean(tokens.accessToken),
      initialized: true,
    };
    emit();
  },

  setUser(user: AuthUser | null): void {
    state = {
      ...state,
      user,
      isAuthenticated:
        Boolean(state.tokens.accessToken) || Boolean(user),
      initialized: true,
    };
    emit();
  },

  setRefreshing(isRefreshing: boolean): void {
    state = {
      ...state,
      isRefreshing,
    };
    emit();
  },

  markInitialized(): void {
    state = {
      ...state,
      initialized: true,
    };
    emit();
  },

  clear(): void {
    state = {
      ...emptyAuthState(),
      initialized: true,
    };
    emit();
  },
};