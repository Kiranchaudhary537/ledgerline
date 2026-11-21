import type * as React from 'react';
import { cn } from '@/lib/utils';

/** A cut panel: paper, a 1px rule, two opposite corners bevelled. Never a shadow beside the border. */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('cut text-ink', className)} {...props} />;
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
  return <h2 className={cn('text-lg', className)} {...props} />;
}

export { Card, CardHeader, CardTitle };
