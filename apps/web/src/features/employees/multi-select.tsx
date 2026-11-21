import { config } from '@acme/shared';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
  count?: number;
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
  const [search, setSearch] = useState('');
  const hasSearch = options.length > config.ui.menuSearchMinOptions;
  const shown = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;
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
        {hasSearch && (
          <input
            type="search"
            aria-label={`Search ${name}`}
            placeholder="Search…"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-1 h-8 w-full rounded-md border border-border bg-transparent px-2"
          />
        )}
        {shown.length === 0 && <p className="p-2 text-muted-foreground">No options</p>}
        {shown.map((o) => (
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
            {o.count !== undefined && (
              <span className="tnum ml-auto text-muted-foreground">{formatCount(o.count)}</span>
            )}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
