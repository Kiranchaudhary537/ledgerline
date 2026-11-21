import type * as React from 'react';
import { cn } from '@/lib/utils';

/** A panel: card white, 1px border, square corners, no shadow. */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('border bg-card text-card-foreground', className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-between gap-3 px-5 pt-4', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('text-base', className)} {...props} />;
}

export { Card, CardHeader, CardTitle };
