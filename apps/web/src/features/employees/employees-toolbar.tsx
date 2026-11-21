import type { EmployeeFacets, Facet, FilterOptions } from '@acme/shared';
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
  facets: EmployeeFacets | undefined;
}

const toOptions = (facet: Facet[] | undefined, labelOf: (v: string) => string): Option[] =>
  (facet ?? []).map(({ value, count }) => ({ value, label: labelOf(value), count }));

export function EmployeesToolbar({ state, update, clear, options, facets }: Props) {
  const [moreOpen, setMoreOpen] = useState(
    state.employmentType.length > 0 || state.gender.length > 0,
  );
  const [text, setText] = useSearchText(state.q, (q) => update({ q }, true));

  const countryName = (code: string) =>
    options?.countries.find((c) => c.code === code)?.name ?? code;

  const filter = (key: MultiKey, name: string, labelOf: (v: string) => string = label) => (
    <MultiSelect
      name={name}
      options={toOptions(facets?.[key], labelOf)}
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
        {filter('country', 'Country', countryName)}
        {filter('department', 'Department', String)}
        {filter('jobTitle', 'Job title', String)}
        {filter('level', 'Level')}
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
          {filter('employmentType', 'Employment type')}
          {filter('gender', 'Gender')}
        </div>
      )}
    </div>
  );
}
