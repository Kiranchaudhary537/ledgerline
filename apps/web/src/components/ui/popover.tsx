import * as PopoverPrimitive from '@radix-ui/react-popover';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        className={cn(
          'pop z-50 max-h-80 min-w-56 origin-(--radix-popover-content-transform-origin) overflow-y-auto overscroll-contain border bg-popover p-1 text-popover-foreground',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
