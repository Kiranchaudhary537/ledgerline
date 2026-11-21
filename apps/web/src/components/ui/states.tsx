import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';

/** Error state for a failed read: the shared message and a retry. */
export function Failed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 p-5">
      <p className="flex items-center gap-2 font-medium text-error">
        <CircleAlert aria-hidden className="size-4 shrink-0" />
        {error instanceof ApiError ? error.message : 'Something went wrong.'}
      </p>
      <Button variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

/** Loading placeholder shaped like table rows. */
export function RowsSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div aria-hidden className="px-5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-6 border-b border-rule">
          {Array.from({ length: cols }, (_c, j) => (
            <div key={j} className="h-3.5 flex-1 rounded-sm bg-paper-3 motion-safe:animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Error, loading placeholder or the content, in that order of priority. */
export function QueryBoundary({
  error,
  onRetry,
  ready,
  skeleton,
  children,
}: {
  error: unknown;
  onRetry: () => void;
  ready: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  if (error) return <Failed error={error} retry={onRetry} />;
  return ready ? <>{children}</> : <>{skeleton}</>;
}

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="space-y-3 px-5 py-10">
      <p className="font-display text-lg font-semibold tracking-display">{title}</p>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
