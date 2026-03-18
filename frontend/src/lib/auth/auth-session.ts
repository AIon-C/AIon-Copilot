let refreshPromise: Promise<unknown> | null = null;

export const authSession = {
  hasInFlightRefresh(): boolean {
    return refreshPromise !== null;
  },

  async runRefreshSingleFlight<T>(factory: () => Promise<T>): Promise<T> {
    if (refreshPromise) {
      return refreshPromise as Promise<T>;
    }

    const promise = factory().finally(() => {
      if (refreshPromise === promise) {
        refreshPromise = null;
      }
    });

    refreshPromise = promise as Promise<unknown>;
    return promise;
  },

  clear(): void {
    refreshPromise = null;
  },
};
