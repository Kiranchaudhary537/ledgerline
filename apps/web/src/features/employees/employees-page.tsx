import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatCount } from '@/lib/format';
import { EmployeeSheet } from './employee-sheet';
import { EmployeesToolbar } from './employees-toolbar';
import { EmployeesResults } from './employees-table';
import { exportParams } from './list-state';
import type { Option } from './multi-select';
import { Pagination } from './pagination';
import { useEmployeeList, useFilterOptions } from './queries';
import { useListUrl } from './use-list-url';

function EmployeesHeader({ total, exportHref }: { total: number | undefined; exportHref: string }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="tnum text-muted-foreground" aria-live="polite">
          {total === undefined ? ' ' : `${formatCount(total)} employees`}
        </p>
      </div>
      <div className="flex gap-2">
        <a href={exportHref} className={buttonVariants({ variant: 'secondary' })}>
          Export CSV
        </a>
        <Button onClick={() => setAdding(true)}>Add employee</Button>
      </div>
      <EmployeeSheet mode="create" open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export function EmployeesPage() {
  const { state, update, clear } = useListUrl();
  const options = useFilterOptions();
  const list = useEmployeeList(state);

  const countryOptions: Option[] = (options.data?.countries ?? []).map((c) => ({
    value: c.code,
    label: c.name,
  }));
  const countryName = (code: string) => countryOptions.find((o) => o.value === code)?.label ?? code;

  const total = list.data?.total;
  const stranded = !!list.data && list.data.data.length === 0 && state.page > 1;
  useEffect(() => {
    if (stranded) update({ page: 1 }, true);
  }, [stranded]);

  return (
    <div className="space-y-4">
      <EmployeesHeader
        total={total}
        exportHref={`/api/employees/export.csv?${exportParams(state)}`}
      />
      <EmployeesToolbar
        state={state}
        update={update}
        clear={clear}
        options={options.data}
        countryOptions={countryOptions}
      />
      <EmployeesResults
        list={list}
        state={state}
        update={update}
        clear={clear}
        countryName={countryName}
      />
      {total ? (
        <Pagination page={state.page} total={total} onPage={(page) => update({ page })} />
      ) : null}
    </div>
  );
}
