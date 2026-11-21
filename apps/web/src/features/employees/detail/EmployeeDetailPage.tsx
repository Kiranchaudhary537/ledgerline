import { History, User, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { HistoryCard } from './components/HistoryCard';
import { ProfileCard } from './components/ProfileCard';
import { SalaryCard } from './components/SalaryCard';

function DetailSkeleton() {
  const bar = 'rounded-sm bg-muted motion-safe:animate-pulse';
  return (
    <div className="space-y-4" aria-busy="true">
      <div className={`${bar} h-24 w-full`} />
      <div className={`${bar} h-9 w-64`} />
      <div className={`${bar} h-40 w-full`} />
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

  return (
    <div className="space-y-5">
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
        onChangeSalary={() => setDialog('salary')}
      />
      <Tabs defaultValue="salary" className="space-y-5">
        <TabsList aria-label="Employee sections">
          <TabsTrigger value="profile">
            <User aria-hidden className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="salary">
            <Wallet aria-hidden className="size-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="history">
            <History aria-hidden className="size-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileCard employee={e} countryName={countryName} onEdit={() => setDialog('edit')} />
        </TabsContent>
        <TabsContent value="salary">
          <SalaryCard employee={e} band={band.data} countryName={countryName} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryCard
            rows={history.data && toHistoryRows(history.data)}
            error={history.error}
            onRetry={() => void history.refetch()}
            countryCode={e.countryCode}
          />
        </TabsContent>
      </Tabs>
      <EmployeeDialogs kind={dialog} employee={e} onClose={() => setDialog(null)} />
    </div>
  );
}
