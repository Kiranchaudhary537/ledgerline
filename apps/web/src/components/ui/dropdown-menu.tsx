import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align="end"
        sideOffset={6}
        className={cn('cut-s z-50 min-w-44 p-1 text-ink shadow-overlay', className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 outline-none data-[highlighted]:bg-accent-wash data-disabled:cursor-not-allowed data-disabled:opacity-55',
        destructive && 'text-error',
        className,
      )}
      {...props}
    />
  );
}

const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Label>) => (
  <MenuPrimitive.Label className={cn('px-2.5 py-1.5 text-xs text-muted', className)} {...props} />
);

const DropdownMenuSeparator = () => <MenuPrimitive.Separator className="my-1 h-px bg-rule" />;

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
