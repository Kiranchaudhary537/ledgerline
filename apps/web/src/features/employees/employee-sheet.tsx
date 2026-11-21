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
import { Input, Select } from '@/components/ui/input';
import { api } from '@/lib/api';
import { label, parseMoney } from '@/lib/format';
import { Field, fieldProps, handleSaveError, StaleBanner } from './form-parts';
import { employeeKey, employeesKey, fetchEmployee, useFilterOptions } from './queries';

interface FormValues {
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  level: string;
  countryCode: string;
  employmentType: string;
  gender: string;
  hireDate: string;
  /** Major units as typed, create only. */
  salary: string;
}

const NAMES = [
  'fullName',
  'email',
  'department',
  'jobTitle',
  'level',
  'countryCode',
  'employmentType',
  'gender',
  'hireDate',
  'salary',
] as const;

const empty: FormValues = {
  fullName: '',
  email: '',
  department: '',
  jobTitle: '',
  level: '',
  countryCode: '',
  employmentType: '',
  gender: '',
  hireDate: '',
  salary: '',
};

const valuesOf = (e: Employee): FormValues => ({
  fullName: e.fullName,
  email: e.email,
  department: e.department,
  jobTitle: e.jobTitle,
  level: e.level,
  countryCode: e.countryCode,
  employmentType: e.employmentType,
  gender: e.gender,
  hireDate: e.hireDate,
  salary: '',
});

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

function EmployeeForm({
  mode,
  employee,
  onOpenChange,
  options,
}: Props & { options: FilterOptions }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [stale, setStale] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: employee ? valuesOf(employee) : empty });

  const department = watch('department');
  const countryCode = watch('countryCode');
  const titles = options.departments.find((d) => d.name === department)?.jobTitles ?? [];
  const currency = options.countries.find((c) => c.code === countryCode)?.currency;

  const fieldError = (name: string, message: string) => {
    const field = name === 'salaryMinor' ? 'salary' : name;
    if (!(NAMES as readonly string[]).includes(field)) return false;
    setError(field as keyof FormValues, { message });
    return true;
  };

  const save = useMutation({
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
    onError: (error) => handleSaveError(error, fieldError, () => setStale(true)),
  });

  function submit(v: FormValues) {
    const { salary, ...fields } = v;
    let body: Record<string, unknown>;
    if (mode === 'create') {
      const salaryMinor = parseMoney(salary, v.countryCode);
      if (salaryMinor === null) {
        return setError('salary', { message: 'Enter an amount such as 19,50,000' });
      }
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
    reset(valuesOf(fresh));
    setStale(false);
  }

  const e = (name: keyof FormValues) => errors[name]?.message;
  const choices = (values: string[]) =>
    values.map((v) => (
      <option key={v} value={v}>
        {label(v)}
      </option>
    ));
  const countryChoices = options.countries.map((c) => (
    <option key={c.code} value={c.code}>
      {c.name}
    </option>
  ));
  const pick = (name: string) => `Choose a ${name}`;

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col gap-4">
      {stale && <StaleBanner onReload={() => void reload()} />}
      <Field id="fullName" label="Full name" error={e('fullName')}>
        <Input
          {...fieldProps('fullName', e('fullName'))}
          autoComplete="off"
          {...register('fullName')}
        />
      </Field>
      <Field id="email" label="Email" error={e('email')}>
        <Input
          {...fieldProps('email', e('email'))}
          type="email"
          autoComplete="off"
          spellCheck={false}
          {...register('email')}
        />
      </Field>
      <Field id="department" label="Department" error={e('department')}>
        <Select
          {...fieldProps('department', e('department'))}
          {...register('department', {
            onChange: () => setValue('jobTitle', ''),
          })}
        >
          <option value="">{pick('department')}</option>
          {options.departments.map((d) => (
            <option key={d.name}>{d.name}</option>
          ))}
        </Select>
      </Field>
      <Field id="jobTitle" label="Job title" error={e('jobTitle')}>
        <Select {...fieldProps('jobTitle', e('jobTitle'))} {...register('jobTitle')}>
          <option value="">{pick('job title')}</option>
          {titles.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field id="level" label="Level" error={e('level')}>
        <Select {...fieldProps('level', e('level'))} {...register('level')}>
          <option value="">{pick('level')}</option>
          {choices(options.levels)}
        </Select>
      </Field>
      <Field id="countryCode" label="Country" error={e('countryCode')}>
        <Select {...fieldProps('countryCode', e('countryCode'))} {...register('countryCode')}>
          <option value="">{pick('country')}</option>
          {countryChoices}
        </Select>
      </Field>
      <Field id="employmentType" label="Employment type" error={e('employmentType')}>
        <Select
          {...fieldProps('employmentType', e('employmentType'))}
          {...register('employmentType')}
        >
          <option value="">{pick('employment type')}</option>
          {choices(options.employmentTypes)}
        </Select>
      </Field>
      <Field id="gender" label="Gender" error={e('gender')}>
        <Select {...fieldProps('gender', e('gender'))} {...register('gender')}>
          <option value="">{pick('gender')}</option>
          {choices(options.genders)}
        </Select>
      </Field>
      <Field id="hireDate" label="Hire date" error={e('hireDate')}>
        <Input {...fieldProps('hireDate', e('hireDate'))} type="date" {...register('hireDate')} />
      </Field>
      {mode === 'create' && (
        <Field
          id="salary"
          label={currency ? `Annual salary (${currency})` : 'Annual salary'}
          error={e('salary')}
        >
          <Input
            {...fieldProps('salary', e('salary'))}
            inputMode="decimal"
            autoComplete="off"
            {...register('salary')}
          />
        </Field>
      )}
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
