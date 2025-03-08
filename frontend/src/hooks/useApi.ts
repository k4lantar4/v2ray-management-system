import { useCallback, useEffect, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import api from '@/services/api';

export interface UseQueryOptions<T> {
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number;
  cacheTime?: number;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  url: string,
  config?: Omit<AxiosRequestConfig, 'url'>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    initialData,
    enabled = true,
    onSuccess,
    onError,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData && enabled);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<T>(url, config);
      setData(response);
      onSuccess?.(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [url, config, enabled, onSuccess, onError]);

  useEffect(() => {
    void fetchData();

    if (refetchInterval && enabled) {
      const intervalId = setInterval(() => void fetchData(), refetchInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchData,
  };
}

export interface UseMutationOptions<TData, TResponse> {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  invalidateQueries?: string[];
}

export interface UseMutationResult<TData, TResponse> {
  mutate: (data: TData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  data: TResponse | undefined;
}

export function useMutation<TData = unknown, TResponse = unknown>(
  url: string,
  method: 'post' | 'put' | 'delete' = 'post',
  options: UseMutationOptions<TData, TResponse> = {}
): UseMutationResult<TData, TResponse> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResponse | undefined>(undefined);

  const mutate = async (mutationData: TData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api[method]<TResponse>(url, mutationData);
      setData(response);
      options.onSuccess?.(response);

      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryUrl => {
          api.invalidateCache(queryUrl);
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
      options.onSettled?.();
    }
  };

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}

export default useQuery; 