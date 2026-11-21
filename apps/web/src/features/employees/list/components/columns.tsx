import type { Employee } from '@acme/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, Chip } from '@/components/ui/pill';
import { SortButton } from '@/components/ui/table';
import { initials } from '@/features/employees/shared/model/people';
import { label, money } from '@/lib/format';
import {
  COLUMNS,
  nextSort,
  parseSort,
  sortDisabledHint,
  type ColumnId,
  type ColumnSpec,
} from '@/features/employees/list/model/columns';
import { employeeLink, type ListState } from '@/features/employees/list/model/list-state';
import type { UpdateList } from '@/features/employees/list/hooks/use-list-url';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- generics must match the library's declaration
  interface ColumnMeta<TData, TValue> {
    align?: 'right';
    /** The API sort field this column's header controls. */
    sortField?: string | undefined;
  }
}

export type RowAction = 'edit' | 'salary' | 'delete';

const col = createColumnHelper<Employee>();
const spec = (id: ColumnId) => COLUMNS.find((c) => c.id === id) as ColumnSpec;
const linkClass = 'font-medium underline-offset-4 hover:underline';

interface Ctx {
  state: ListState;
  update: UpdateList;
  countryName: (code: string) => string;
  onAction: (employee: Employee, action: RowAction) => void;
}

function RowMenu({
  employee,
  state,
  onAction,
}: Pick<Ctx, 'state' | 'onAction'> & { employee: Employee }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${employee.fullName}`}
        className="key key-flat key-sm key-icon"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link to={employeeLink(employee.id, state)}>View</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction(employee, 'edit')}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction(employee, 'salary')}>
          Change salary
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onAction(employee, 'delete')}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function employeeColumns({ state, update, countryName, onAction }: Ctx) {
  const header = (id: ColumnId) => () => {
    const { label: text, sortField, align } = spec(id);
    if (!sortField) return text;
    const current = parseSort(state.sort);
    return (
      <SortButton
        direction={current.field === sortField ? current.dir : null}
        onClick={() => update({ sort: nextSort(state.sort, sortField) }, false)}
        disabledHint={sortDisabledHint(state, sortField)}
        alignRight={align === 'right'}
      >
        {text}
      </SortButton>
    );
  };
  const meta = (id: ColumnId) => ({ align: spec(id).align, sortField: spec(id).sortField });

  return [
    col.accessor('employeeCode', {
      id: 'code',
      meta: meta('code'),
      header: header('code'),
      cell: (c) => <span className="font-outlier text-xs text-muted">{c.getValue()}</span>,
    }),
    col.accessor('fullName', {
      id: 'name',
      meta: meta('name'),
      header: header('name'),
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <Avatar initials={initials(c.getValue())} size="sm" />
          <Link to={employeeLink(c.row.original.id, state)} className={linkClass}>
            {c.getValue()}
          </Link>
        </span>
      ),
    }),
    col.accessor('department', {
      id: 'department',
      meta: meta('department'),
      header: header('department'),
      cell: (c) => <Chip>{c.getValue()}</Chip>,
    }),
    col.accessor('jobTitle', {
      id: 'jobTitle',
      meta: meta('jobTitle'),
      header: header('jobTitle'),
    }),
    col.accessor('level', {
      id: 'level',
      meta: meta('level'),
      header: header('level'),
      cell: (c) => <Chip>{label(c.getValue())}</Chip>,
    }),
    col.accessor('countryCode', {
      id: 'country',
      meta: meta('country'),
      header: header('country'),
      cell: (c) => countryName(c.getValue()),
    }),
    col.accessor('salaryMinor', {
      id: 'salary',
      meta: meta('salary'),
      header: header('salary'),
      cell: (c) => money(c.getValue(), c.row.original.countryCode),
    }),
    col.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (c) => <RowMenu employee={c.row.original} state={state} onAction={onAction} />,
    }),
  ];
}
