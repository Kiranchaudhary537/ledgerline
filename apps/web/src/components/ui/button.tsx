import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** One primary (ink-green) button per screen; the rest are outlined or plain. */
const buttonVariants = cva(
  'press inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 border border-transparent px-4 font-medium whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border-input bg-card hover:bg-accent',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        link: 'h-auto px-0 underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'h-8 px-3',
        icon: 'size-9 px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
