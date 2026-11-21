import type * as React from 'react';
import { cn } from '@/lib/utils';

const control =
  'h-9 w-full rounded-md border border-border bg-background px-2.5 text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:opacity-50';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(control, 'tnum', className)} {...props} />;
}

/** Native select: keyboard, mobile and screen reader behaviour for free. */
function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(control, 'pr-7', className)} {...props} />;
}

export { Input, Select };
