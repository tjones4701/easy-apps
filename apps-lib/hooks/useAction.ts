import { useState, useCallback } from "react";
import { callAction } from "../callAction.js";

interface UseActionState<TResult> {
  data: TResult | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for calling a backend action.
 *
 * @example
 * const { data, loading, error, execute } = useAction<Note[]>("leave-a-note", "getNotes");
 * useEffect(() => { execute(); }, [execute]);
 */
export function useAction<TInput = unknown, TResult = unknown>(
  appId: string,
  actionName: string,
) {
  const [state, setState] = useState<UseActionState<TResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (input?: TInput): Promise<TResult> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await callAction<TResult>(
          appId,
          actionName,
          input ?? {},
        );
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw err;
      }
    },
    [appId, actionName],
  );

  return { ...state, execute };
}
