import type { Employee, SalaryChange } from '@acme/shared';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { formatDate, formatPercent, label, money } from '@/lib/format';
import { bandPosition, percentChange, POSITION_TEXT } from './band-geometry';
import { BandRail } from './band-rail';
import { DeleteDialog } from './delete-dialog';
import { EmployeeSheet } from './employee-sheet';
import { useBand, useEmployee, useFilterOptions, useSalaryHistory } from './queries';
import { SalaryChangeDialog } from './salary-change-dialog';

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const employee = useEmployee(id);
  const band = useBand(employee.data);
  const options = useFilterOptions();
  const [dialog, setDialog] = useState<'edit' | 'salary' | 'delete' | null>(null);

  if (employee.isPending) return <DetailSkeleton />;
  if (employee.isError) {
    const message =
      employee.error instanceof ApiError ? employee.error.message : 'Something went wrong.';
    return (
      <div role="alert" className="space-y-3">
        <p>{message}</p>
        <div className="flex gap-2">
          {!(employee.error instanceof ApiError && employee.error.code === 'NOT_FOUND') && (
            <Button variant="secondary" onClick={() => void employee.refetch()}>
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

  const e: Employee = employee.data;
  const country =
    options.data?.countries.find((c) => c.code === e.countryCode)?.name ?? e.countryCode;
  const stats = band.data;
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="space-y-6">
      <Link
        to="/employees"
        className="text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Back to employees
      </Link>
      <div className="grid gap-10 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <section aria-label="Details" className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{e.fullName}</h1>
            <p>
              {e.jobTitle}, {label(e.level)}
            </p>
          </div>
          <dl className="space-y-2">
            <Fact term="Department">{e.department}</Fact>
            <Fact term="Country">{country}</Fact>
            <Fact term="Employee code">{e.employeeCode}</Fact>
            <Fact term="Employment type">{label(e.employmentType)}</Fact>
            <Fact term="Gender">{label(e.gender)}</Fact>
            <Fact term="Email">{e.email}</Fact>
            <Fact term="Hire date">{formatDate(e.hireDate)}</Fact>
          </dl>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDialog('edit')}>
              Edit details
            </Button>
            <Button variant="secondary" onClick={() => setDialog('delete')}>
              Delete
            </Button>
          </div>
        </section>

        <div className="space-y-8">
          <section aria-label="Salary" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="tnum">
                <span className="text-3xl font-semibold">
                  {money(e.salaryMinor, e.countryCode)}
                </span>{' '}
                <span className="text-muted-foreground">a year</span>
              </p>
              <Button onClick={() => setDialog('salary')}>Change salary</Button>
            </div>
            {stats && (
              <div className="space-y-1">
                <BandRail
                  band={stats}
                  countryCode={e.countryCode}
                  markers={[{ value: e.salaryMinor, kind: 'current' }]}
                />
                <p className="text-xs text-muted-foreground">
                  {e.jobTitle}, {label(e.level)}, {country}: middle half{' '}
                  {money(stats.p25, e.countryCode)} to {money(stats.p75, e.countryCode)}, median{' '}
                  {money(stats.median, e.countryCode)}, {stats.count} people. {e.fullName} is{' '}
                  {POSITION_TEXT[bandPosition(e.salaryMinor, stats)]}.
                </p>
              </div>
            )}
            <p className="tnum">
              <span className="text-muted-foreground">Compa-ratio </span>
              <span className="font-semibold">{e.compaRatio.toFixed(2)}</span>
            </p>
          </section>

          <History id={id} countryCode={e.countryCode} />
        </div>
      </div>

      <EmployeeSheet mode="edit" employee={e} open={dialog === 'edit'} onOpenChange={close} />
      <SalaryChangeDialog
        employee={e}
        band={stats}
        open={dialog === 'salary'}
        onOpenChange={close}
      />
      <DeleteDialog employee={e} open={dialog === 'delete'} onOpenChange={close} />
    </div>
  );
}

function History({ id, countryCode }: { id: string; countryCode: string }) {
  const history = useSalaryHistory(id);
  return (
    <section aria-labelledby="history-title" className="space-y-2">
      <h2 id="history-title" className="text-lg font-semibold">
        Salary history
      </h2>
      {history.isPending && <div className="h-24 motion-safe:animate-pulse rounded-md bg-muted" />}
      {history.isError && (
        <div role="alert" className="space-y-2">
          <p>{history.error.message}</p>
          <Button variant="secondary" onClick={() => void history.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {history.data && (
        <div className="overflow-x-auto">
          <table className="tnum w-full border-collapse">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <Th>Date</Th>
                <Th right>From</Th>
                <Th right>To</Th>
                <Th right>Change</Th>
                <Th>Reason</Th>
                <Th>Changed by</Th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((c) => (
                <HistoryRow key={c.id} change={c} countryCode={countryCode} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const Th = ({ children, right }: { children: string; right?: boolean }) => (
  <th
    scope="col"
    className={`border-b border-border pr-4 pb-1.5 font-semibold whitespace-nowrap ${right ? 'text-right' : ''}`}
  >
    {children}
  </th>
);

function HistoryRow({ change: c, countryCode }: { change: SalaryChange; countryCode: string }) {
  const cell = 'h-9 border-b border-border pr-4 whitespace-nowrap';
  return (
    <tr>
      <td className={cell}>{formatDate(c.changedAt)}</td>
      {c.oldSalaryMinor === null ? (
        <td className={`${cell} text-right text-muted-foreground`}>Starting salary</td>
      ) : (
        <td className={`${cell} text-right`}>{money(c.oldSalaryMinor, countryCode)}</td>
      )}
      <td className={`${cell} text-right`}>{money(c.newSalaryMinor, countryCode)}</td>
      <td className={`${cell} text-right`}>
        {c.oldSalaryMinor === null
          ? ''
          : formatPercent(percentChange(c.oldSalaryMinor, c.newSalaryMinor))}
      </td>
      <td className={`${cell} max-w-[24ch] truncate`} title={c.reason}>
        {c.reason}
      </td>
      <td className={cell}>{c.changedByName ?? 'Imported'}</td>
    </tr>
  );
}

function DetailSkeleton() {
  const bar = 'h-4 rounded-sm bg-muted motion-safe:animate-pulse';
  return (
    <div className="grid gap-10 md:grid-cols-[18rem_1fr]" aria-busy="true">
      <div className="space-y-3">
        <div className={`${bar} h-7 w-48`} />
        <div className={`${bar} w-36`} />
        <div className={`${bar} w-32`} />
        <div className={`${bar} w-40`} />
      </div>
      <div className="space-y-6">
        <div className={`${bar} h-9 w-64`} />
        <div className={`${bar} h-9 w-full`} />
        <div className={`${bar} h-28 w-full`} />
      </div>
      <span className="sr-only">Loading employee…</span>
    </div>
  );
}
