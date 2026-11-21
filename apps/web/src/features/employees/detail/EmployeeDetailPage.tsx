import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSalaryHistory } from '@/features/employees/detail/api/salary-history';
import { useEmployeePager } from '@/features/employees/detail/api/employee-pager';
import { toHistoryRows } from '@/features/employees/detail/model/history';
import { EmployeeDialogs, type DialogKind } from '@/features/employees/forms/EmployeeDialogs';
import { useListUrl } from '@/features/employees/list/hooks/use-list-url';
import { employeeLink, listToParams } from '@/features/employees/list/model/list-state';
import { useBand } from '@/features/employees/shared/api/band';
import { useEmployee } from '@/features/employees/shared/api/employee';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { ApiError } from '@/lib/api';
import { EmployeeHeader } from './components/EmployeeHeader';
import { HistoryTimeline } from './components/HistoryTimeline';
import { ProfileCard } from './components/ProfileCard';
import { SalaryChart } from './components/SalaryChart';
import { SalaryPanel } from './components/SalaryPanel';

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-24 w-full max-w-md" />
      <Skeleton className="h-52 w-full" />
      <Skeleton className="h-64 w-full" />
      <span className="sr-only">Loading employee…</span>
    </div>
  );
}

function DetailError({ error, retry }: { error: Error; retry: () => void }) {
  const notFound = error instanceof ApiError && error.code === 'NOT_FOUND';
  return (
    <div role="alert" className="space-y-3">
      <p>{error instanceof ApiError ? error.message : 'Something went wrong.'}</p>
      <div className="flex gap-2">
        {!notFound && (
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        )}
        <Button variant="secondary" asChild>
          <Link to="/employees">Back to employees</Link>
        </Button>
      </div>
    </div>
  );
}

/** One page, no tabs: who, what they earn and where that sits, how it got here, then the profile. */
export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const { state: listState } = useListUrl();
  const employee = useEmployee(id);
  const band = useBand(employee.data);
  const history = useSalaryHistory(id);
  const options = useFilterOptions();
  const pager = useEmployeePager(Number(id), listState);
  const [dialog, setDialog] = useState<DialogKind | null>(null);

  if (employee.isPending) return <DetailSkeleton />;
  if (employee.isError)
    return <DetailError error={employee.error} retry={() => void employee.refetch()} />;

  const e = employee.data;
  const countryName =
    options.data?.countries.find((c) => c.code === e.countryCode)?.name ?? e.countryCode;
  const query = listToParams(listState).toString();
  const listTo = (page: number, to: number) => employeeLink(to, { ...listState, page });
  const rows = history.data && toHistoryRows(history.data);

  return (
    <div className="space-y-6">
      <EmployeeHeader
        employee={e}
        countryName={countryName}
        backTo={query ? `/employees?${query}` : '/employees'}
        pager={
          pager && {
            position: pager.position,
            total: pager.total,
            prevTo: pager.prev && listTo(pager.prev.page, pager.prev.id),
            nextTo: pager.next && listTo(pager.next.page, pager.next.id),
          }
        }
        onEdit={() => setDialog('edit')}
        onDelete={() => setDialog('delete')}
      />
      <SalaryPanel
        employee={e}
        band={{ ...band, refetch: () => void band.refetch() }}
        countryName={countryName}
        onChangeSalary={() => setDialog('salary')}
      />
      <SalaryChart
        rows={rows}
        error={history.error}
        onRetry={() => void history.refetch()}
        countryCode={e.countryCode}
        name={e.fullName}
      />
      <HistoryTimeline
        rows={rows}
        error={history.error}
        onRetry={() => void history.refetch()}
        countryCode={e.countryCode}
      />
      <ProfileCard employee={e} countryName={countryName} onEdit={() => setDialog('edit')} />
      <EmployeeDialogs kind={dialog} employee={e} onClose={() => setDialog(null)} />
    </div>
  );
}
