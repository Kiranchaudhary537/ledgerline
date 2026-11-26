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
}

export function LoginForm({ pending, fieldErrors, formError, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    for (const [name, message] of Object.entries(fieldErrors ?? {})) {
      if (name === 'email' || name === 'password') setError(name, { message });
    }
  }, [fieldErrors, setError]);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
