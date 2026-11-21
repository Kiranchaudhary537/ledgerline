import { cn } from '@/lib/utils';

interface Props {
  field: string;
  children: string;
  sort: string;
  onSort: (sort: string) => void;
  disabledHint?: string | undefined;
  alignRight?: boolean;
}

export function SortHeader({ field, children, sort, onSort, disabledHint, alignRight }: Props) {
  const [active, dir] = sort.split(':');
  const isActive = active === field;
  const disabled = !!disabledHint;
  return (
    <button
      type="button"
      title={disabledHint}
      aria-disabled={disabled || undefined}
      aria-label={disabled ? `${children}, ${disabledHint}` : undefined}
      onClick={() => {
        if (disabled) return;
        onSort(`${field}:${isActive && dir === 'asc' ? 'desc' : 'asc'}`);
      }}
      className={cn(
        'inline-flex items-center gap-1 font-semibold hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        alignRight && 'flex-row-reverse',
        disabled && 'cursor-not-allowed opacity-60 hover:text-muted-foreground',
        isActive && 'text-foreground',
      )}
    >
      {children}
      <span aria-hidden className="w-2 text-[10px]">
        {isActive ? (dir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </button>
  );
}
