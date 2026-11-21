import { salaryChangeSchema, type Employee, type StatsRow } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatPercent, money, parseMoney } from '@/lib/format';
import { bandPosition, percentChange, POSITION_TEXT } from './band-geometry';
import { BandRail } from './band-rail';
import { Field, fieldProps, handleSaveError, StaleBanner } from './form-parts';
import { employeeKey, employeesKey, fetchEmployee } from './queries';

interface FormValues {
  /** Major units as typed. */
  newSalary: string;
  reason: string;
}

export function SalaryChangeDialog({
  employee,
  band,
  open,
  onOpenChange,
}: {
  employee: Employee;
  band: StatsRow | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Change salary"
        description={`${employee.fullName} earns ${money(employee.salaryMinor, employee.countryCode)} a year.`}
      >
        <SalaryChangeForm employee={employee} band={band} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SalaryChangeForm({
  employee,
  band,
  onDone,
}: {
  employee: Employee;
  band: StatsRow | undefined;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [stale, setStale] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { newSalary: '', reason: '' } });

  const { countryCode, currency } = employee;
  const proposed = parseMoney(watch('newSalary'), countryCode);
  const valid = proposed !== null && proposed > 0;

  const fieldError = (name: string, message: string) => {
    const field = name === 'newSalaryMinor' ? 'newSalary' : name;
    if (field !== 'newSalary' && field !== 'reason') return false;
    setError(field, { message });
    return true;
  };

  const change = useMutation({
    mutationFn: (body: unknown) =>
      api<Employee>(`/api/employees/${employee.id}/salary-changes`, { method: 'POST', body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeesKey });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Salary changed');
      onDone();
    },
    onError: (error) => handleSaveError(error, fieldError, () => setStale(true)),
  });

  function submit(v: FormValues) {
    const newSalaryMinor = parseMoney(v.newSalary, countryCode);
    if (newSalaryMinor === null) {
      return setError('newSalary', { message: 'Enter an amount such as 19,50,000' });
    }
    const parsed = salaryChangeSchema.safeParse({
      newSalaryMinor,
      reason: v.reason,
      version: employee.version,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fieldError(String(issue.path[0]), issue.message);
      return;
    }
    change.mutate(parsed.data);
  }

  async function reload() {
    await queryClient.fetchQuery({
      queryKey: employeeKey(String(employee.id)),
      queryFn: () => fetchEmployee(String(employee.id)),
      staleTime: 0,
    });
    setStale(false);
  }

  const salaryError = errors.newSalary?.message;
  const reasonError = errors.reason?.message;

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {stale && <StaleBanner onReload={() => void reload()} />}
      <Field id="newSalary" label={`New annual salary (${currency})`} error={salaryError}>
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

      <div className="space-y-1">
        {band && (
          <BandRail
            band={band}
            countryCode={countryCode}
            markers={[
              { value: employee.salaryMinor, kind: 'current' },
              ...(valid ? [{ value: proposed, kind: 'proposed' as const }] : []),
            ]}
          />
        )}
        <p className="tnum text-xs text-muted-foreground" aria-live="polite">
          {valid
            ? `${formatPercent(percentChange(employee.salaryMinor, proposed))} from today` +
              (band ? `, ${POSITION_TEXT[bandPosition(proposed, band)]}` : '')
            : 'Type the new salary to see where it lands in the band.'}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? 'Saving…' : 'Change salary'}
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
