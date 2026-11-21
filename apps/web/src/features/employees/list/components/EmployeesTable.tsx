import type { EmployeeList } from '@acme/shared';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { employeeColumns } from '@/features/employees/list/components/columns';
import type { ListState } from '@/features/employees/list/model/list-state';
import type { UpdateList } from '@/features/employees/list/hooks/use-list-url';

const SKELETON_ROWS = 10;
const cellBase = 'border-b border-border pr-3';

interface Result {
  data: EmployeeList | undefined;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}

interface Props {
  list: Result;
  state: ListState;
  update: UpdateList;
  clear: () => void;
  countryName: (code: string) => string;
}

export function EmployeesResults({ list, state, update, clear, countryName }: Props) {
  if (list.isError && !list.data) {
    return (
      <div role="alert" className="space-y-3 border-y border-border py-6">
        <p>{list.error instanceof ApiError ? list.error.message : 'Something went wrong.'}</p>
        <Button variant="secondary" onClick={() => void list.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto" aria-busy={list.isFetching}>
      <EmployeesTable list={list} state={state} update={update} countryName={countryName} />
      {list.isPending && <p className="sr-only">Loading employees…</p>}
      {list.data && list.data.data.length === 0 && (
        <div className="space-y-3 py-10">
          <p className="text-lg font-semibold">No employees match these filters</p>
          <Button variant="secondary" onClick={clear}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function EmployeesTable({ list, state, update, countryName }: Omit<Props, 'clear'>) {
  const columns = employeeColumns(state, update, countryName);
  const table = useReactTable({
    data: list.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });
  const [sortField, dir] = state.sort.split(':');

  return (
    <table className="tnum w-full border-collapse">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((h) => (
              <th
                key={h.id}
                scope="col"
                aria-sort={
                  h.column.columnDef.meta?.sortField === sortField
                    ? dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                className={cn(
                  cellBase,
                  'pb-1.5 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground',
                  h.column.columnDef.meta?.align === 'right' && 'pr-0 text-right',
                )}
              >
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {list.isPending &&
          Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <tr key={i} aria-hidden>
              {columns.map((_c, j) => (
                <td key={j} className={cn('h-9', cellBase)}>
                  <div className="h-3.5 w-3/4 rounded-sm bg-muted motion-safe:animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:[&>td]:bg-band-soft/40">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  'h-9 whitespace-nowrap',
                  cellBase,
                  cell.column.columnDef.meta?.align === 'right' && 'pr-0 text-right',
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
