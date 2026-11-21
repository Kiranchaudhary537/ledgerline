import { config } from '@acme/shared';
import { useEmployeeList } from '@/features/employees/list/api/employee-list';
import type { ListState } from '@/features/employees/list/model/list-state';
import { locate } from '@/features/employees/detail/model/pager';

/**
 * Position of an employee in the list query they came from ("3 of 2,818") and their neighbours.
 * Reads the same cached list pages as the list screen; fetches the adjacent page only at a page edge.
 */
export function useEmployeePager(id: number, state: ListState) {
  const list = useEmployeeList(state);
  const ids = list.data?.data.map((e) => e.id) ?? [];
  const index = ids.indexOf(id);
  const pageSize = list.data?.pageSize ?? config.paging.defaultPageSize;
  const total = list.data?.total ?? 0;
  const atStart = index === 0 && state.page > 1;
  const atEnd = index !== -1 && index === ids.length - 1 && state.page * pageSize < total;
  const before = useEmployeeList({ ...state, page: state.page - 1 }, atStart);
  const after = useEmployeeList({ ...state, page: state.page + 1 }, atEnd);

  if (!list.data) return null;
  return locate({
    id,
    page: state.page,
    pageSize,
    total,
    ids,
    before: atStart ? before.data?.data.at(-1)?.id : undefined,
    after: atEnd ? after.data?.data[0]?.id : undefined,
  });
}
