import { useState, useEffect, useCallback } from "react";
import { ApiError } from "@/lib/api";
import type { AppError } from "@/lib/types";

export interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
}

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { immediate = true, onSuccess, onError } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFunction();
      setState({ data: result, isLoading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error =
        err instanceof ApiError
          ? {
              code: err.code,
              message: err.message,
              details: err.details,
              timestamp: err.timestamp,
            }
          : {
              code: "UNKNOWN_ERROR",
              message: err instanceof Error ? err.message : "Unknown error",
              details: err as unknown,
              timestamp: new Date().toISOString(),
            };

      setState({ data: null, isLoading: false, error });
      onError?.(error);
      throw error;
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
    refetch: execute,
  };
}
