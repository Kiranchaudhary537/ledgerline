import type * as React from 'react';
import { cn } from '@/lib/utils';

const control = 'field';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(control, 'tnum', className)} {...props} />;
}

/** Native select: keyboard, mobile and screen reader behaviour for free. */
function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(control, 'pr-7', className)} {...props} />;
}

export { Input, Select };
