import type { Employee } from '@acme/shared';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { EmptyState, Failed } from '@/components/ui/states';
import { EmployeeDialogs, type DialogKind } from '@/features/employees/forms/EmployeeDialogs';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { useEmployeeList, useFacets } from '@/features/employees/list/api/employee-list';
import type { RowAction } from './components/columns';
import { EmployeesHeader } from './components/EmployeesHeader';
import { EmployeesTable } from './components/EmployeesTable';
import { EmployeesToolbar } from './components/EmployeesToolbar';
import { Pagination } from './components/Pagination';
import { useListUrl } from './hooks/use-list-url';
import { useSearchText } from './hooks/use-search-text';
import { exportParams } from './model/list-state';

export function EmployeesPage() {
  const { state, update, clear } = useListUrl();
  const options = useFilterOptions();
  const list = useEmployeeList(state);
  const facets = useFacets(state);
  const [searchText, setSearchText] = useSearchText(state.q, (q) => update({ q }, true));
  const [dialog, setDialog] = useState<{ kind: DialogKind; employee?: Employee } | null>(null);

  const countryName = (code: string) =>
    options.data?.countries.find((c) => c.code === code)?.name ?? code;

  const total = list.data?.total;
  const rows = list.data?.data ?? [];
  const stranded = !!list.data && rows.length === 0 && state.page > 1;
  useEffect(() => {
    if (stranded) update({ page: 1 }, true);
  }, [stranded]);

  const onAction = (employee: Employee, action: RowAction) => setDialog({ kind: action, employee });

  return (
    <div className="space-y-4">
      <EmployeesHeader
        total={total}
        exportHref={`/api/employees/export.csv?${exportParams(state)}`}
        onAdd={() => setDialog({ kind: 'create' })}
      />
      <Card className="overflow-hidden">
        <EmployeesToolbar
          state={state}
          update={update}
          clear={clear}
          facets={facets.data}
          countryName={countryName}
          searchText={searchText}
          onSearchText={setSearchText}
        />
        {list.isError && !list.data ? (
          <Failed error={list.error} retry={() => void list.refetch()} />
        ) : (
          <div aria-busy={list.isFetching}>
            <EmployeesTable
              rows={rows}
              loading={list.isPending}
              state={state}
              update={update}
              countryName={countryName}
              onAction={onAction}
            />
            {list.isPending && <p className="sr-only">Loading employees…</p>}
            {list.data && rows.length === 0 && (
              <EmptyState
                title="No employees match these filters"
                action={{ label: 'Clear filters', onClick: clear }}
              />
            )}
          </div>
        )}
        {total ? (
          <Pagination page={state.page} total={total} onPage={(page) => update({ page })} />
        ) : null}
      </Card>
      <EmployeeDialogs
        kind={dialog?.kind ?? null}
        employee={dialog?.employee}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
