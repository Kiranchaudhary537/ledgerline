import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

/** Props that tie an input to its error message for assistive tech. */
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
