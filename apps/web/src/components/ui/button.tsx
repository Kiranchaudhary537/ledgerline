import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** Keycaps (see index.css): one solid cobalt key per screen; the rest sit on the key face or have no edge. */
const buttonVariants = cva('key', {
  variants: {
    variant: {
      default: 'key-primary',
      secondary: '',
      destructive: 'key-danger',
      ghost: 'key-flat',
      link: 'key-flat underline-offset-4 hover:underline',
    },
    size: {
      default: '',
      sm: 'key-sm',
      /** Square icon key: needs an aria-label. */
      icon: 'key-icon',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

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
