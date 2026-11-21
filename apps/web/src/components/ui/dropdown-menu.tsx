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
        className={cn(
          'pop z-50 min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) border bg-popover p-1 text-popover-foreground',
          className,
        )}
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
        'flex cursor-pointer items-center gap-2 px-2.5 py-1.5 outline-none data-highlighted:bg-accent data-disabled:cursor-not-allowed data-disabled:opacity-55',
        destructive && 'text-destructive',
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
  <MenuPrimitive.Label
    className={cn('px-2.5 py-1.5 text-xs text-muted-foreground', className)}
    {...props}
  />
);

const DropdownMenuSeparator = () => <MenuPrimitive.Separator className="my-1 h-px bg-border" />;

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
