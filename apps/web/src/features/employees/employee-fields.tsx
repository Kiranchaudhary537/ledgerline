import type { FilterOptions } from '@acme/shared';
import type { ComponentProps, ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Input, Select } from '@/components/ui/input';
import { label } from '@/lib/format';
import type { FormValues } from './employee-form-values';
import { Field, fieldProps } from './form-parts';

type Form = UseFormReturn<FormValues>;
type Name = keyof FormValues;

function TextField({
  methods,
  name,
  title,
  ...input
}: { methods: Form; name: Name; title: string } & ComponentProps<typeof Input>) {
  const error = methods.formState.errors[name]?.message;
  return (
    <Field id={name} label={title} error={error}>
      <Input {...fieldProps(name, error)} {...input} {...methods.register(name)} />
    </Field>
  );
}

function SelectField({
  methods,
  name,
  title,
  noun,
  onChange,
  children,
}: {
  methods: Form;
  name: Name;
  title: string;
  noun: string;
  onChange?: () => void;
  children: ReactNode;
}) {
  const error = methods.formState.errors[name]?.message;
  return (
    <Field id={name} label={title} error={error}>
      <Select
        {...fieldProps(name, error)}
        {...methods.register(name, onChange ? { onChange } : undefined)}
      >
        <option value="">{`Choose a ${noun}`}</option>
        {children}
      </Select>
    </Field>
  );
}

const choices = (values: string[]) =>
  values.map((v) => (
    <option key={v} value={v}>
      {label(v)}
    </option>
  ));

export function EmployeeFields({
  form,
  options,
  creating,
}: {
  form: Form;
  options: FilterOptions;
  creating: boolean;
}) {
  const department = form.watch('department');
  const country = options.countries.find((c) => c.code === form.watch('countryCode'));
  const currency = country?.currency;
  const titles = options.departments.find((d) => d.name === department)?.jobTitles ?? [];

  return (
    <>
      <TextField methods={form} name="fullName" title="Full name" autoComplete="off" />
      <TextField
        methods={form}
        name="email"
        title="Email"
        type="email"
        autoComplete="off"
        spellCheck={false}
      />
      <SelectField
        methods={form}
        name="department"
        title="Department"
        noun="department"
        onChange={() => form.setValue('jobTitle', '')}
      >
        {options.departments.map((d) => (
          <option key={d.name}>{d.name}</option>
        ))}
      </SelectField>
      <SelectField methods={form} name="jobTitle" title="Job title" noun="job title">
        {titles.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </SelectField>
      <SelectField methods={form} name="level" title="Level" noun="level">
        {choices(options.levels)}
      </SelectField>
      {creating ? (
        <SelectField methods={form} name="countryCode" title="Country" noun="country">
          {options.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <Field id="countryCode" label="Country">
          <p>{country?.name}</p>
        </Field>
      )}
      <SelectField
        methods={form}
        name="employmentType"
        title="Employment type"
        noun="employment type"
      >
        {choices(options.employmentTypes)}
      </SelectField>
      <SelectField methods={form} name="gender" title="Gender" noun="gender">
        {choices(options.genders)}
      </SelectField>
      <TextField methods={form} name="hireDate" title="Hire date" type="date" />
      {creating && (
        <TextField
          methods={form}
          name="salary"
          title={currency ? `Annual salary (${currency})` : 'Annual salary'}
          inputMode="decimal"
          autoComplete="off"
        />
      )}
    </>
  );
}
