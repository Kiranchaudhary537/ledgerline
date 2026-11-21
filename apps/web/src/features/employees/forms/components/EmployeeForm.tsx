import type { Employee, FilterOptions } from '@acme/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import type { SaveErrorHandlers } from '@/features/employees/forms/api/save-error';
import {
  buildEmployeeBody,
  EMPTY_VALUES,
  formFieldOf,
  isFormField,
  valuesOf,
  type FormValues,
} from '@/features/employees/forms/model/employee-form';
import { EmployeeFields } from './EmployeeFields';
import { StaleBanner } from './StaleBanner';

interface Props {
  mode: 'create' | 'edit';
  employee?: Employee | undefined;
  options: FilterOptions;
  pending: boolean;
  onSave: (body: unknown, handlers: SaveErrorHandlers) => void;
  /** Re-reads the employee after a conflict. */
  onReload: () => Promise<Employee>;
}

export function EmployeeForm({ mode, employee, options, pending, onSave, onReload }: Props) {
  const [stale, setStale] = useState(false);
  const form = useForm<FormValues>({ defaultValues: employee ? valuesOf(employee) : EMPTY_VALUES });
  const { setError } = form;

  const onFieldError = (name: string, message: string) => {
    const field = formFieldOf(name);
    if (!isFormField(field)) return false;
    setError(field, { message });
    return true;
  };

  function submit(values: FormValues) {
    const built = buildEmployeeBody(mode, values, employee?.version ?? 0);
    if (!built.ok) {
      for (const [name, message] of Object.entries(built.errors)) onFieldError(name, message);
      return;
    }
    onSave(built.body, { onFieldError, onStale: () => setStale(true) });
  }

  async function reload() {
    form.reset(valuesOf(await onReload()));
    setStale(false);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="flex flex-1 flex-col gap-4">
      {stale && <StaleBanner onReload={() => void reload()} />}
      <EmployeeFields form={form} options={options} creating={mode === 'create'} />
      <div className="mt-auto flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Add employee' : 'Save changes'}
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
