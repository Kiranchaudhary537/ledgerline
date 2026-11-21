import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';

/** Error state for a failed read: the shared message and a retry. */
export function Failed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 p-5">
      <p className="flex items-center gap-2 font-medium text-destructive">
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
        <div key={i} className="flex h-12 items-center gap-6 border-b">
          {Array.from({ length: cols }, (_c, j) => (
            <Skeleton key={j} className="h-3.5 flex-1" />
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

/** What goes here, and the action that fills it. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="space-y-3 px-5 py-10">
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
