import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';

/** Props that tie a control to its label-less error message. */
export const fieldProps = (id: string, error?: string) => ({
  id,
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : undefined,
});

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function StaleBanner({ onReload }: { onReload: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-md border border-destructive p-3"
    >
      <p className="text-destructive">Someone else changed this employee.</p>
      <Button type="button" variant="secondary" size="sm" onClick={onReload}>
        Reload
      </Button>
    </div>
  );
}

/**
 * Shows a failed save the way docs/error-handling.md says: `fields` inline, STALE_VERSION as a banner,
 * anything else as a toast. `fieldError` returns false for a field the form does not have.
 */
export function handleSaveError(
  error: unknown,
  fieldError: (name: string, message: string) => boolean,
  onStale: () => void,
) {
  if (!(error instanceof ApiError)) return toast.error('Something went wrong. Please try again.');
  if (error.code === 'UNAUTHENTICATED') return; // handled globally
  if (error.code === 'STALE_VERSION') return onStale();
  const shown = Object.entries(error.fields ?? {}).filter(([n, m]) => fieldError(n, m));
  if (shown.length === 0) toast.error(error.message);
}
