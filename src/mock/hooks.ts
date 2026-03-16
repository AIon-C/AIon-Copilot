import { useCallback, useEffect, useState } from 'react';

export type PaginatedStatus = 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted';

export const useMockQuery = <T>(queryFn: () => Promise<T>) => {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let active = true;

    queryFn().then((result) => {
      if (active) setData(result);
    });

    return () => {
      active = false;
    };
  }, [queryFn]);

  return {
    data,
    isLoading: data === undefined,
  };
};

export const useMockPaginatedQuery = <T>(queryFn: () => Promise<T[]>) => {
  const [results, setResults] = useState<T[] | undefined>(undefined);
  const [status, setStatus] = useState<PaginatedStatus>('LoadingFirstPage');

  useEffect(() => {
    let active = true;

    queryFn().then((data) => {
      if (!active) return;
      setResults(data);
      setStatus('Exhausted');
    });

    return () => {
      active = false;
    };
  }, [queryFn]);

  const loadMore = useCallback(() => {
    setStatus('Exhausted');
  }, []);

  return {
    results,
    status,
    loadMore,
  };
};
