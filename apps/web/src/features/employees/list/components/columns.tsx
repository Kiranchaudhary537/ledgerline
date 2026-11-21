import type { Employee } from '@acme/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import { label, money } from '@/lib/format';
import { CompaRatioCell } from '@/features/employees/list/components/CompaRatioCell';
import type { ListState } from '@/features/employees/list/model/list-state';
import { SortHeader } from '@/features/employees/list/components/SortHeader';
import type { UpdateList } from '@/features/employees/list/hooks/use-list-url';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- generics must match the library's declaration
  interface ColumnMeta<TData, TValue> {
    align?: 'right';
    /** The API sort field this column's header controls. */
    sortField?: string;
  }
}

const SALARY_SORT_HINT = 'Filter to one country to sort by salary';
const col = createColumnHelper<Employee>();

export function employeeColumns(
  state: ListState,
  update: UpdateList,
  countryName: (code: string) => string,
) {
  const sortHeader = (
    field: string,
    text: string,
    extra: { hint?: string; right?: boolean } = {},
  ) => (
    <SortHeader
      field={field}
      sort={state.sort}
      onSort={(sort) => update({ sort }, false)}
      disabledHint={extra.hint}
      alignRight={extra.right ?? false}
    >
      {text}
    </SortHeader>
  );
  const salaryHint = state.country.length === 1 ? undefined : SALARY_SORT_HINT;

  return [
    col.accessor('employeeCode', {
      header: 'Code',
      cell: (c) => <span className="text-muted-foreground">{c.getValue()}</span>,
    }),
    col.accessor('fullName', {
      id: 'name',
      meta: { sortField: 'name' },
      header: () => sortHeader('name', 'Name'),
      cell: (c) => (
        <Link
          to={`/employees/${c.row.original.id}`}
          className="font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {c.getValue()}
        </Link>
      ),
    }),
    col.display({
      id: 'role',
      meta: { sortField: 'level' },
      header: () => sortHeader('level', 'Role'),
      cell: (c) => (
        <>
          {c.row.original.jobTitle}
          <span className="block text-xs leading-tight text-muted-foreground">
            {label(c.row.original.level)}
          </span>
        </>
      ),
    }),
    col.accessor('countryCode', {
      header: 'Country',
      cell: (c) => countryName(c.getValue()),
    }),
    col.accessor('salaryMinor', {
      id: 'salary',
      meta: { align: 'right', sortField: 'salary' },
      header: () => sortHeader('salary', 'Salary', { hint: salaryHint, right: true }),
      cell: (c) => money(c.getValue(), c.row.original.countryCode),
    }),
    col.accessor('compaRatio', {
      meta: { align: 'right', sortField: 'compaRatio' },
      header: () => sortHeader('compaRatio', 'Compa-ratio', { right: true }),
      cell: (c) => <CompaRatioCell value={c.getValue()} />,
    }),
  ];
}
