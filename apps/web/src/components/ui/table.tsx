import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

type Align = 'left' | 'right';

/** Header row on a paper-2 well, 48px body rows, a hairline between rows. Numbers: pass align="right". */
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
        'h-10 border-b border-rule bg-paper-2 px-4 align-middle text-xs font-medium whitespace-nowrap text-muted',
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
        'h-12 border-b border-rule px-4 whitespace-nowrap',
        align === 'right' && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

/** Row hover tint shared by every table. */
export const rowHover = 'hover:[&>td]:bg-paper-2';

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
        'inline-flex items-center gap-1 font-medium hover:text-ink',
        alignRight && 'flex-row-reverse',
        disabled && 'cursor-not-allowed opacity-60 hover:text-muted',
        direction && 'text-ink',
      )}
    >
      {children}
      <Icon aria-hidden className={cn('size-3.5', !direction && 'opacity-50')} />
    </button>
  );
}
