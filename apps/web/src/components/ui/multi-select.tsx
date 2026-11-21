import { Check, ChevronDown, Search } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCount } from '@/lib/format';
import { filterByLabel, moveActive } from '@/lib/option-search';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  name: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Long, open-ended lists (country, department, job title) get a search box; short fixed ones do not. */
  searchable?: boolean;
}

export function MultiSelect({ name, options, selected, onChange, searchable = false }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const shown = filterByLabel(options, query);
  const activeId = shown[active] ? `${listId}-${active}` : undefined;

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  function onKeyDown(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const next = moveActive(active, e.key, shown.length);
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView?.({ block: 'nearest' });
    } else if (e.key === 'Enter' || (e.key === ' ' && !searchable)) {
      e.preventDefault();
      const option = shown[active];
      if (option) toggle(option.value);
    }
  }

  return (
    <Popover
      onOpenChange={() => {
        setQuery('');
        setActive(0);
      }}
    >
      <PopoverTrigger
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          selected.length > 0 && 'border-primary',
        )}
      >
        {name}
        {selected.length > 0 && (
          <span className="tnum rounded-full bg-primary-soft px-1.5 text-xs font-semibold text-primary">
            {selected.length}
          </span>
        )}
        <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent aria-label={`${name} filter`} className="p-0">
        {searchable && (
          <div className="relative border-b border-border p-2">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle"
            />
            <input
              type="search"
              aria-label={`Search ${name}`}
              placeholder={`Search ${name.toLowerCase()}…`}
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={activeId}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-8 w-full rounded-md border border-border bg-card pr-2 pl-8 text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
        )}
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label={name}
          aria-activedescendant={searchable ? undefined : activeId}
          tabIndex={searchable ? -1 : 0}
          onKeyDown={searchable ? undefined : onKeyDown}
          className="max-h-60 overflow-y-auto p-1 outline-none"
        >
          {shown.length === 0 && (
            <li role="presentation" className="px-2 py-2 text-muted-foreground">
              {options.length === 0 ? 'No options' : 'No matches'}
            </li>
          )}
          {shown.map((o, i) => {
            const checked = selected.includes(o.value);
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={checked}
                onClick={() => toggle(o.value)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
                  i === active && 'bg-muted',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-sm border border-border',
                    checked && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {checked && <Check className="size-3" />}
                </span>
                {o.label}
                {o.count !== undefined && (
                  <span className="tnum ml-auto text-muted-foreground">{formatCount(o.count)}</span>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
