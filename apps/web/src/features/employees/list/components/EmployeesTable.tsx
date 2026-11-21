import type { Employee } from '@acme/shared';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th, rowHover } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ariaSort } from '@/features/employees/list/model/columns';
import type { ListState } from '@/features/employees/list/model/list-state';
import type { UpdateList } from '@/features/employees/list/hooks/use-list-url';
import { employeeColumns, type RowAction } from './columns';

const SKELETON_ROWS = 10;

interface Props {
  rows: Employee[];
  loading: boolean;
  state: ListState;
  update: UpdateList;
  countryName: (code: string) => string;
  onAction: (employee: Employee, action: RowAction) => void;
}

export function EmployeesTable({ rows, loading, state, update, countryName, onAction }: Props) {
  const columns = employeeColumns({ state, update, countryName, onAction });
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((h) => {
                const meta = h.column.columnDef.meta;
                return (
                  <Th
                    key={h.id}
                    align={meta?.align ?? 'left'}
                    aria-sort={ariaSort(state.sort, meta?.sortField)}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </Th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody key={rows.map((r) => r.id).join()} className={cn(!loading && 'rows-fresh')}>
          {loading &&
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <tr key={i} aria-hidden>
                {columns.map((c) => (
                  <Td key={c.id}>
                    <Skeleton className="h-3.5 w-3/4" />
                  </Td>
                ))}
              </tr>
            ))}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={rowHover}>
              {row.getVisibleCells().map((cell) => (
                <Td
                  key={cell.id}
                  align={cell.column.columnDef.meta?.align ?? 'left'}
                  className={cn(cell.column.id === 'actions' && 'w-12 px-2')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
