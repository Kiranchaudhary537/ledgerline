import { loginSchema, type LoginInput } from '@acme/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { WakingHint } from '@/components/ui/states';

interface Props {
  pending: boolean;
  /** Server errors by field, shown under that field. */
  fieldErrors: Record<string, string> | undefined;
  /** Failure with no field to blame. */
  formError: string | null;
  onSubmit: (values: LoginInput) => void;
  /** Reviewer account on the deployed demo; absent locally and in tests. */
  demo?: LoginInput;
}

export function LoginForm({ pending, fieldErrors, formError, onSubmit, demo }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const useDemo = (account: LoginInput) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  useEffect(() => {
    for (const [name, message] of Object.entries(fieldErrors ?? {})) {
      if (name === 'email' || name === 'password') setError(name, { message });
    }
  }, [fieldErrors, setError]);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {demo && (
        <div
          role="note"
          aria-label="Demo account"
          className="space-y-2 border bg-muted p-3 text-sm"
        >
          <p>
            Salary data is private, so the app asks for a login. Reviewers can use the demo account:
          </p>
          <p className="font-mono">
            {demo.email} / {demo.password}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => useDemo(demo)}>
            Use demo account
          </Button>
        </div>
      )}
      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          {...fieldProps('email', errors.email?.message)}
          type="email"
          autoComplete="username"
          spellCheck={false}
          {...register('email')}
        />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        <Input
          {...fieldProps('password', errors.password?.message)}
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </Button>
      <WakingHint pending={pending} />
    </form>
  );
}
