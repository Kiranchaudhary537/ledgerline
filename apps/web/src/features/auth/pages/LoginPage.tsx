import { useNavigate, useSearchParams } from 'react-router';
import { Card } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { useLogin } from '@/features/auth/api/session';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { safeNext } from '@/features/auth/model/redirect';

/** Field errors show inline; only a failure with no field to blame becomes the form-level message. */
function formErrorOf(error: unknown) {
  if (error instanceof ApiError) return error.fields ? null : error.message;
  return error ? 'Something went wrong. Please try again.' : null;
}

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();

  const submit = (values: Parameters<typeof login.mutate>[0]) =>
    login.mutate(values, {
      onSuccess: () => void navigate(safeNext(params.get('next')), { replace: true }),
    });

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-6 text-xl font-semibold">Log in to ACME Pay</h1>
        <LoginForm
          pending={login.isPending}
          fieldErrors={login.error instanceof ApiError ? login.error.fields : undefined}
          formError={formErrorOf(login.error)}
          onSubmit={submit}
        />
      </Card>
    </main>
  );
}
