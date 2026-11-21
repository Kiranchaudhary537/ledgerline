import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

type Align = 'left' | 'right';

/** Grey header row, 48px body rows, rules between rows. Numbers: pass align="right". */
export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('tnum w-full border-collapse', className)} {...props} />;
}

export function Th({
  align = 'left',
  className,
  ...props
}: React.ComponentProps<'th'> & { align?: Align }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-10 bg-muted px-4 align-middle text-xs font-semibold whitespace-nowrap text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  align = 'left',
  className,
  ...props
}: React.ComponentProps<'td'> & { align?: Align }) {
  return (
    <td
      className={cn(
        'h-12 border-b border-border px-4 whitespace-nowrap',
        align === 'right' && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

/** Row hover tint shared by every table. */
export const rowHover = 'hover:[&>td]:bg-muted/60';

interface SortButtonProps {
  children: string;
  /** null = not the active column. */
  direction: 'asc' | 'desc' | null;
  onClick: () => void;
  /** Why sorting is unavailable; makes the button aria-disabled. */
  disabledHint?: string | undefined;
  alignRight?: boolean;
}

export function SortButton({
  children,
  direction,
  onClick,
  disabledHint,
  alignRight,
}: SortButtonProps) {
  const disabled = !!disabledHint;
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      title={disabledHint}
      aria-disabled={disabled || undefined}
      aria-label={disabled ? `${children}, ${disabledHint}` : undefined}
      onClick={() => !disabled && onClick()}
      className={cn(
        'inline-flex items-center gap-1 font-semibold hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        alignRight && 'flex-row-reverse',
        disabled && 'cursor-not-allowed opacity-60 hover:text-muted-foreground',
        direction && 'text-foreground',
      )}
    >
      {children}
      <Icon aria-hidden className={cn('size-3.5', !direction && 'opacity-50')} />
    </button>
  );
}
