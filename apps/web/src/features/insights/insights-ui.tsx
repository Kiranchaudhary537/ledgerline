import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';

export const th =
  'border-b border-border pr-3 pb-1.5 text-left text-xs font-semibold text-muted-foreground';
export const td = 'h-9 border-b border-border pr-3 whitespace-nowrap';

export function Failed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 border-y border-border py-6">
      <p>{error instanceof ApiError ? error.message : 'Something went wrong.'}</p>
      <Button variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function Skeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div aria-hidden className="space-y-0">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-9 items-center gap-6 border-b border-border">
          {Array.from({ length: cols }, (_c, j) => (
            <div key={j} className="h-3.5 flex-1 rounded-sm bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
