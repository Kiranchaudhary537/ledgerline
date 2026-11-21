import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

export interface SaveErrorHandlers {
  /** Shows a server field error inline; returns false for a field the form does not have. */
  onFieldError: (name: string, message: string) => boolean;
  onStale: () => void;
}

/**
 * Shows a failed save the way docs/error-handling.md says: `fields` inline, STALE_VERSION as a banner,
 * anything else as a toast.
 */
export function handleSaveError(error: unknown, { onFieldError, onStale }: SaveErrorHandlers) {
  if (!(error instanceof ApiError)) return toast.error('Something went wrong. Please try again.');
  if (error.code === 'UNAUTHENTICATED') return; // handled globally
  if (error.code === 'STALE_VERSION') return onStale();
  const shown = Object.entries(error.fields ?? {}).filter(([n, m]) => onFieldError(n, m));
  if (shown.length === 0) toast.error(error.message);
}
