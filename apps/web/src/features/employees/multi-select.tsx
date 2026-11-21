import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

export function MultiSelect({
  name,
  options,
  selected,
  onChange,
}: {
  name: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 hover:border-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          selected.length > 0 && 'border-primary',
        )}
      >
        {name}
        {selected.length > 0 && (
          <span className="tnum font-semibold text-primary">{selected.length}</span>
        )}
        <span aria-hidden className="text-xs text-muted-foreground">
          ▾
        </span>
      </PopoverTrigger>
      <PopoverContent aria-label={`${name} filter`}>
        {options.length === 0 && <p className="p-2 text-muted-foreground">No options</p>}
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            {o.label}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
