import { config } from '@acme/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

/** `onUnauthenticated` sends the user to the login page (see `goToLogin` in router.tsx). */
export function createQueryClient(onUnauthenticated: () => void) {
  const onError = (error: Error) => {
    if (!(error instanceof ApiError)) return;
    if (error.code === 'UNAUTHENTICATED') onUnauthenticated();
    else toast.error(error.message);
  };
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && count < config.ui.queryRetries,
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({ onError }),
    // Mutations (login, forms) show their own errors; only a lost session is handled globally.
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') onError(error);
      },
    }),
  });
}
