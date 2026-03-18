"use client";

import { useSyncExternalStore } from "react";
import { authStore } from "../model/auth-store";

export function useAuth() {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState,
  );

  return {
    ...state,
    hasAccessToken: Boolean(state.tokens.accessToken),
  };
}