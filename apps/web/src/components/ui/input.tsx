import type * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full rounded-md border border-border bg-background px-3 text-base placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring aria-invalid:border-destructive disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
