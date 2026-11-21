import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, fieldProps } from '@/features/employees/form-parts';
import { ApiError, api } from '@/lib/api';
import { sessionKey, type SessionUser } from './session';

/** Only same-site paths: blocks open redirects like `?next=//evil.com`. */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/employees';
}

function useLogin(setError: UseFormSetError<LoginInput>) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginInput) =>
      api<{ user: SessionUser }>('/api/auth/login', { method: 'POST', body }),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKey, data);
      void navigate(safeNext(params.get('next')), { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          if (name === 'email' || name === 'password') setError(name, { message });
        }
      }
    },
  });
}

/** Field errors show inline; only a failure with no field to blame becomes the form-level message. */
function formErrorOf(error: unknown) {
  if (error instanceof ApiError) return error.fields ? null : error.message;
  return error ? 'Something went wrong. Please try again.' : null;
}

export function LoginPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const login = useLogin(setError);
  const formError = formErrorOf(login.error);

  return (
    <main className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 text-xl font-semibold">Log in to ACME Pay</h1>
      <form noValidate onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </main>
  );
}
