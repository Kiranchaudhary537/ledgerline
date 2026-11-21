import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, api } from '@/lib/api';
import { sessionKey, type SessionUser } from './session';

/** Only same-site paths: blocks open redirects like `?next=//evil.com`. */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/employees';
}

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
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

  const formError =
    login.error instanceof ApiError && !login.error.fields
      ? login.error.message
      : login.error instanceof ApiError
        ? null
        : login.error && 'Something went wrong. Please try again.';

  return (
    <main className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 text-xl font-semibold">Log in to ACME Pay</h1>
      <form noValidate onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" aria-live="polite" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" aria-live="polite" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
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
