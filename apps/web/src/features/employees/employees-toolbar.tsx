import type { FilterOptions } from '@acme/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { label } from '@/lib/format';
import { hasFilters, type ListState, type MultiKey } from './list-state';
import { MultiSelect, type Option } from './multi-select';
import { useSearchText } from './use-search-text';
import type { UpdateList } from './use-list-url';

interface Props {
  state: ListState;
  update: UpdateList;
  clear: () => void;
  options: FilterOptions | undefined;
  countryOptions: Option[];
}

const plain = (values: string[] | undefined): Option[] =>
  (values ?? []).map((v) => ({ value: v, label: label(v) }));

export function EmployeesToolbar({ state, update, clear, options, countryOptions }: Props) {
  const [moreOpen, setMoreOpen] = useState(
    state.employmentType.length > 0 || state.gender.length > 0,
  );
  const [text, setText] = useSearchText(state.q, (q) => update({ q }, true));

  const departments = options?.departments ?? [];
  const titleOptions: Option[] = departments
    .filter((d) => state.department.length === 0 || state.department.includes(d.name))
    .flatMap((d) => d.jobTitles)
    .map((t) => ({ value: t, label: t }));

  const filter = (key: MultiKey, name: string, opts: Option[]) => (
    <MultiSelect
      name={name}
      options={opts}
      selected={state[key]}
      onChange={(next) => update({ [key]: next })}
    />
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            type="search"
            name="search"
            aria-label="Search by name, email or code"
            placeholder="Search name, email or code…"
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {filter('country', 'Country', countryOptions)}
        {filter(
          'department',
          'Department',
          departments.map((d) => ({ value: d.name, label: d.name })),
        )}
        {filter('jobTitle', 'Job title', titleOptions)}
        {filter('level', 'Level', plain(options?.levels))}
        <Button
          variant="ghost"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          More filters
        </Button>
        {hasFilters(state) && (
          <Button variant="ghost" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>
      {text.trim().length === 1 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
      )}
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {filter('employmentType', 'Employment type', plain(options?.employmentTypes))}
          {filter('gender', 'Gender', plain(options?.genders))}
        </div>
      )}
    </div>
  );
}
