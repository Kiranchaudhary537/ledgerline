import type * as React from 'react';
import { cn } from '@/lib/utils';

const control =
  'h-9 w-full border border-input bg-card px-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-55';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(control, className)} {...props} />;
}

/** Native select: keyboard, mobile and screen reader behaviour for free. */
function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(control, 'pr-7', className)} {...props} />;
}

export { Input, Select };
