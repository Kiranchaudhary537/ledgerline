import type { Employee, StatsRow } from '@acme/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Field, fieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { SaveErrorHandlers } from '@/features/employees/forms/api/save-error';
import {
  buildSalaryChangeBody,
  EMPTY_SALARY_VALUES,
  proposalText,
  proposedMinor,
  salaryFieldOf,
  type SalaryFormValues,
} from '@/features/employees/forms/model/salary-change';
import { BandRail } from '@/features/employees/shared/components/BandRail';
import { StaleBanner } from './StaleBanner';

interface Props {
  employee: Employee;
  band: StatsRow | undefined;
  pending: boolean;
  onSave: (body: unknown, handlers: SaveErrorHandlers) => void;
  onReload: () => Promise<Employee>;
}

function ProposalSummary({
  employee,
  band,
  proposed,
}: {
  employee: Employee;
  band: StatsRow | undefined;
  proposed: number | null;
}) {
  return (
    <div className="space-y-1">
      {band && (
        <BandRail
          band={band}
          countryCode={employee.countryCode}
          markers={[
            { value: employee.salaryMinor, kind: 'current' },
            ...(proposed === null ? [] : [{ value: proposed, kind: 'proposed' as const }]),
          ]}
        />
      )}
      <p className="tnum text-xs text-muted" aria-live="polite">
        {proposalText(employee.salaryMinor, proposed, band)}
      </p>
    </div>
  );
}

export function SalaryChangeForm({ employee, band, pending, onSave, onReload }: Props) {
  const [stale, setStale] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SalaryFormValues>({ defaultValues: EMPTY_SALARY_VALUES });

  const onFieldError = (name: string, message: string) => {
    const field = salaryFieldOf(name);
    if (field !== 'newSalary' && field !== 'reason') return false;
    setError(field, { message });
    return true;
  };

  function submit(values: SalaryFormValues) {
    const built = buildSalaryChangeBody(values, employee);
    if (!built.ok) {
      for (const [name, message] of Object.entries(built.errors)) onFieldError(name, message);
      return;
    }
    onSave(built.body, { onFieldError, onStale: () => setStale(true) });
  }

  const salaryError = errors.newSalary?.message;
  const reasonError = errors.reason?.message;

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {stale && (
        <StaleBanner
          onReload={() => {
            void onReload().then(() => setStale(false));
          }}
        />
      )}
      <Field id="newSalary" label={`New annual salary (${employee.currency})`} error={salaryError}>
        <Input
          {...fieldProps('newSalary', salaryError)}
          inputMode="decimal"
          autoComplete="off"
          {...register('newSalary')}
        />
      </Field>
      <Field id="reason" label="Reason" error={reasonError}>
        <Input {...fieldProps('reason', reasonError)} autoComplete="off" {...register('reason')} />
      </Field>
      <ProposalSummary
        employee={employee}
        band={band}
        proposed={proposedMinor(watch('newSalary'), employee.countryCode)}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Change salary'}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
      </div>
    </form>
  );
}
