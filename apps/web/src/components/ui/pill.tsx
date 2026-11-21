import type * as React from 'react';

/** A category as text with a hairline border; at most one per table row. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      {children}
    </span>
  );
}
