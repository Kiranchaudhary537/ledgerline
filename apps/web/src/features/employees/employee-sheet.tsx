import {
  employeeCreateSchema,
  employeeUpdateSchema,
  type Employee,
  type FilterOptions,
} from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { EmployeeFields } from './employee-fields';
import { EMPTY_VALUES, isFormField, valuesOf, type FormValues } from './employee-form-values';
import { handleSaveError, parseAmount, StaleBanner } from './form-parts';
import { employeeKey, employeesKey, fetchEmployee, useFilterOptions } from './queries';

type Props =
  | { mode: 'create'; employee?: undefined; open: boolean; onOpenChange: (open: boolean) => void }
  | { mode: 'edit'; employee: Employee; open: boolean; onOpenChange: (open: boolean) => void };

export function EmployeeSheet(props: Props) {
  const { mode, open, onOpenChange } = props;
  // The selects need their options before the form mounts, or an edited value would be lost.
  const options = useFilterOptions().data;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        side
        title={mode === 'create' ? 'Add employee' : 'Edit details'}
        description={
          mode === 'create'
            ? 'Enter the details and starting salary.'
            : 'Salary is changed separately, so it is kept in the history.'
        }
      >
        {options ? <EmployeeForm {...props} options={options} /> : <p>Loading…</p>}
      </DialogContent>
    </Dialog>
  );
}

function useSaveEmployee(
  { mode, employee, onOpenChange }: Props,
  fieldError: (name: string, message: string) => boolean,
  onStale: () => void,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: unknown) =>
      mode === 'create'
        ? api<Employee>('/api/employees', { method: 'POST', body })
        : api<Employee>(`/api/employees/${employee.id}`, { method: 'PATCH', body }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: employeesKey });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success(mode === 'create' ? 'Employee added' : 'Details saved');
      onOpenChange(false);
      if (mode === 'create') void navigate(`/employees/${saved.id}`);
    },
    onError: (error) => handleSaveError(error, fieldError, onStale),
  });
}

function EmployeeForm(props: Props & { options: FilterOptions }) {
  const { mode, employee, options } = props;
  const queryClient = useQueryClient();
  const [stale, setStale] = useState(false);
  const form = useForm<FormValues>({
    defaultValues: employee ? valuesOf(employee) : EMPTY_VALUES,
  });
  const { setError } = form;

  const fieldError = (name: string, message: string) => {
    const field = name === 'salaryMinor' ? 'salary' : name;
    if (!isFormField(field)) return false;
    setError(field, { message });
    return true;
  };
  const save = useSaveEmployee(props, fieldError, () => setStale(true));

  function submit(v: FormValues) {
    const { salary, ...fields } = v;
    let body: Record<string, unknown>;
    if (mode === 'create') {
      const salaryMinor = parseAmount(salary, v.countryCode, (message) =>
        setError('salary', { message }),
      );
      if (salaryMinor === null) return;
      body = { ...fields, salaryMinor };
    } else {
      body = { ...fields, version: employee.version };
    }
    const parsed = (mode === 'create' ? employeeCreateSchema : employeeUpdateSchema).safeParse(
      body,
    );
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fieldError(String(issue.path[0]), issue.message);
      return;
    }
    save.mutate(parsed.data);
  }

  async function reload() {
    if (mode !== 'edit') return;
    const fresh = await queryClient.fetchQuery({
      queryKey: employeeKey(String(employee.id)),
      queryFn: () => fetchEmployee(String(employee.id)),
      staleTime: 0,
    });
    form.reset(valuesOf(fresh));
    setStale(false);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="flex flex-1 flex-col gap-4">
      {stale && <StaleBanner onReload={() => void reload()} />}
      <EmployeeFields form={form} options={options} withSalary={mode === 'create'} />
      <div className="mt-auto flex gap-2 pt-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : mode === 'create' ? 'Add employee' : 'Save changes'}
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
