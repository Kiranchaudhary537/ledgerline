import { config, type Employee } from '@acme/shared';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { formatCount, label, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EmployeeSheet } from './employee-sheet';
import {
  exportParams,
  hasFilters,
  listToParams,
  parseListState,
  PAGE_SIZE,
  type ListState,
  type MultiKey,
} from './list-state';
import { MultiSelect, type Option } from './multi-select';
import { useEmployeeList, useFilterOptions } from './queries';

const SALARY_SORT_HINT = 'Filter to one country to sort by salary';

const col = createColumnHelper<Employee>();
const SORT_FIELD: Record<string, string> = {
  name: 'name',
  role: 'level',
  salary: 'salary',
  compaRatio: 'compaRatio',
};
const RIGHT = new Set(['salary', 'compaRatio']);

function CompaRatio({ value }: { value: number }) {
  const low = value < config.compaRatio.extremeLow;
  const high = value > config.compaRatio.extremeHigh;
  return (
    <span className={cn('tnum', (low || high) && 'font-semibold text-destructive')}>
      {(low || high) && (
        <>
          <span aria-hidden className="mr-1 text-xs">
            {low ? '▼' : '▲'}
          </span>
          <span className="sr-only">{low ? 'Below range: ' : 'Above range: '}</span>
        </>
      )}
      {value.toFixed(2)}
    </span>
  );
}

function SortHeader({
  field,
  children,
  sort,
  onSort,
  disabledHint,
  alignRight,
}: {
  field: string;
  children: string;
  sort: string;
  onSort: (sort: string) => void;
  disabledHint?: string | undefined;
  alignRight?: boolean;
}) {
  const [active, dir] = sort.split(':');
  const isActive = active === field;
  const disabled = !!disabledHint;
  return (
    <button
      type="button"
      title={disabledHint}
      aria-disabled={disabled || undefined}
      aria-label={disabled ? `${children}, ${disabledHint}` : undefined}
      onClick={() => {
        if (disabled) return;
        onSort(`${field}:${isActive && dir === 'asc' ? 'desc' : 'asc'}`);
      }}
      className={cn(
        'inline-flex items-center gap-1 font-semibold hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        alignRight && 'flex-row-reverse',
        disabled && 'cursor-not-allowed opacity-60 hover:text-muted-foreground',
        isActive && 'text-foreground',
      )}
    >
      {children}
      <span aria-hidden className="w-2 text-[10px]">
        {isActive ? (dir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </button>
  );
}

export function EmployeesPage() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseListState(params), [params]);
  const [adding, setAdding] = useState(false);
  const [moreOpen, setMoreOpen] = useState(
    state.employmentType.length > 0 || state.gender.length > 0,
  );
  const options = useFilterOptions();
  const list = useEmployeeList(state);

  function update(patch: Partial<ListState>, replace = false) {
    const next = { ...state, page: 1, ...patch };
    // Dropping a country can make a salary sort invalid.
    setParams(listToParams(parseListState(listToParams(next))), { replace });
  }

  const [text, setText] = useState(state.q);
  const pushed = useRef(state.q);
  useEffect(() => {
    if (state.q !== pushed.current) {
      pushed.current = state.q;
      setText(state.q);
    }
  }, [state.q]);
  useEffect(() => {
    const value = text.trim();
    if (value === pushed.current || (value.length > 0 && value.length < config.search.minLength))
      return;
    const timer = setTimeout(() => {
      pushed.current = value;
      update({ q: value }, true);
    }, config.ui.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [text]);

  const countryOptions: Option[] = (options.data?.countries ?? []).map((c) => ({
    value: c.code,
    label: c.name,
  }));
  const departments = options.data?.departments ?? [];
  const titleOptions: Option[] = departments
    .filter((d) => state.department.length === 0 || state.department.includes(d.name))
    .flatMap((d) => d.jobTitles)
    .map((t) => ({ value: t, label: t }));
  const plain = (values: string[] | undefined): Option[] =>
    (values ?? []).map((v) => ({ value: v, label: label(v) }));

  const filter = (key: MultiKey, name: string, opts: Option[]) => (
    <MultiSelect
      name={name}
      options={opts}
      selected={state[key]}
      onChange={(next) => update({ [key]: next })}
    />
  );

  const salaryHint = state.country.length === 1 ? undefined : SALARY_SORT_HINT;
  const columns = [
    col.accessor('employeeCode', {
      header: 'Code',
      cell: (c) => <span className="text-muted-foreground">{c.getValue()}</span>,
    }),
    col.accessor('fullName', {
      id: 'name',
      header: () => (
        <SortHeader field="name" sort={state.sort} onSort={(sort) => update({ sort }, false)}>
          Name
        </SortHeader>
      ),
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
      header: () => (
        <SortHeader field="level" sort={state.sort} onSort={(sort) => update({ sort }, false)}>
          Role
        </SortHeader>
      ),
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
      cell: (c) => countryOptions.find((o) => o.value === c.getValue())?.label ?? c.getValue(),
    }),
    col.accessor('salaryMinor', {
      id: 'salary',
      header: () => (
        <SortHeader
          field="salary"
          sort={state.sort}
          onSort={(sort) => update({ sort }, false)}
          disabledHint={salaryHint}
          alignRight
        >
          Salary
        </SortHeader>
      ),
      cell: (c) => money(c.getValue(), c.row.original.countryCode),
    }),
    col.accessor('compaRatio', {
      header: () => (
        <SortHeader
          field="compaRatio"
          sort={state.sort}
          onSort={(sort) => update({ sort }, false)}
          alignRight
        >
          Compa-ratio
        </SortHeader>
      ),
      cell: (c) => <CompaRatio value={c.getValue()} />,
    }),
  ];

  const table = useReactTable({
    data: list.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const total = list.data?.total;
  const stranded = !!list.data && list.data.data.length === 0 && state.page > 1;
  useEffect(() => {
    if (stranded) update({ page: 1 }, true);
  }, [stranded]);
  const pages = total === undefined ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total ? (state.page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(state.page * PAGE_SIZE, total ?? 0);
  const clear = () => setParams(new URLSearchParams());
  const exportHref = `/api/employees/export.csv?${exportParams(state)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="tnum text-muted-foreground" aria-live="polite">
            {total === undefined ? ' ' : `${formatCount(total)} employees`}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={exportHref} className={buttonVariants({ variant: 'secondary' })}>
            Export CSV
          </a>
          <Button onClick={() => setAdding(true)}>Add employee</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full max-w-xs">
            <Input
              type="search"
              name="search"
              aria-label="Search by name, email or code"
              placeholder="Search name, email or code…"
              autoComplete="off"
              spellCheck={false}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {filter('country', 'Country', countryOptions)}
          {filter(
            'department',
            'Department',
            departments.map((d) => ({ value: d.name, label: d.name })),
          )}
          {filter('jobTitle', 'Job title', titleOptions)}
          {filter('level', 'Level', plain(options.data?.levels))}
          <Button
            variant="ghost"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          >
            More filters
          </Button>
          {hasFilters(state) && (
            <Button variant="ghost" onClick={clear}>
              Clear filters
            </Button>
          )}
        </div>
        {text.trim().length === 1 && (
          <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
        )}
        {moreOpen && (
          <div className="flex flex-wrap items-center gap-2">
            {filter('employmentType', 'Employment type', plain(options.data?.employmentTypes))}
            {filter('gender', 'Gender', plain(options.data?.genders))}
          </div>
        )}
      </div>

      {list.isError && !list.data ? (
        <div role="alert" className="space-y-3 border-y border-border py-6">
          <p>{list.error instanceof ApiError ? list.error.message : 'Something went wrong.'}</p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto" aria-busy={list.isFetching}>
          <table className="tnum w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((h) => {
                    const [field, dir] = state.sort.split(':');
                    return (
                      <th
                        key={h.id}
                        scope="col"
                        aria-sort={
                          SORT_FIELD[h.column.id] === field
                            ? dir === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : undefined
                        }
                        className={cn(
                          'border-b border-border pr-3 pb-1.5 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground',
                          RIGHT.has(h.column.id) && 'pr-0 text-right',
                        )}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {list.isPending &&
                Array.from({ length: 10 }, (_, i) => (
                  <tr key={i} aria-hidden>
                    {columns.map((_c, j) => (
                      <td key={j} className="h-9 border-b border-border pr-3">
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
                        'h-9 border-b border-border pr-3 whitespace-nowrap',
                        RIGHT.has(cell.column.id) && 'pr-0 text-right',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

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
      )}

      {total ? (
        <nav aria-label="Pages" className="tnum flex items-center justify-end gap-3">
          <span className="text-muted-foreground">
            {formatCount(first)}–{formatCount(last)} of {formatCount(total)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={state.page <= 1}
            onClick={() => update({ page: state.page - 1 })}
          >
            Previous
          </Button>
          <span>
            Page {state.page} of {formatCount(pages)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={state.page >= pages}
            onClick={() => update({ page: state.page + 1 })}
          >
            Next
          </Button>
        </nav>
      ) : null}

      <EmployeeSheet mode="create" open={adding} onOpenChange={setAdding} />
    </div>
  );
}
