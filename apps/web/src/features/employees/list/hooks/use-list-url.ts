import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  listToParams,
  parseListState,
  type ListState,
} from '@/features/employees/list/model/list-state';

export type UpdateList = (patch: Partial<ListState>, replace?: boolean) => void;

/** The list state lives in the URL so filters, sort and page survive reload and sharing. */
export function useListUrl() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseListState(params), [params]);

  const update: UpdateList = (patch, replace = false) => {
    const next = { ...state, page: 1, ...patch };
    // Dropping a country can make a salary sort invalid.
    setParams(listToParams(parseListState(listToParams(next))), { replace });
  };
  const clear = () => setParams(new URLSearchParams());
  return { state, update, clear };
}
