import { useCallback, useMemo, useState } from 'react';

type Status = 'success' | 'error' | 'settled' | 'pending' | null;

type Options<TResponse> = {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useMockMutation = <TRequest, TResponse>(action: (values: TRequest) => Promise<TResponse>) => {
  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === 'pending', [status]);
  const isSuccess = useMemo(() => status === 'success', [status]);
  const isError = useMemo(() => status === 'error', [status]);
  const isSettled = useMemo(() => status === 'settled', [status]);

  const mutate = useCallback(
    async (values: TRequest, options?: Options<TResponse>) => {
      try {
        setData(null);
        setError(null);
        setStatus('pending');

        const response = await action(values);
        setData(response);
        setStatus('success');
        options?.onSuccess?.(response);

        return response;
      } catch (caughtError) {
        const resolvedError = caughtError as Error;
        setError(resolvedError);
        setStatus('error');
        options?.onError?.(resolvedError);

        if (options?.throwError) throw resolvedError;
        return null;
      } finally {
        setStatus('settled');
        options?.onSettled?.();
      }
    },
    [action],
  );

  return {
    mutate,
    data,
    error,
    isPending,
    isError,
    isSuccess,
    isSettled,
  };
};
