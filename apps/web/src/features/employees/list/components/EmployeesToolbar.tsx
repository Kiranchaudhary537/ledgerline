import type { EmployeeFacets } from '@acme/shared';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { label } from '@/lib/format';
import { facetOptions, FILTERS } from '@/features/employees/list/model/filters';
import { hasFilters, type ListState } from '@/features/employees/list/model/list-state';
import type { UpdateList } from '@/features/employees/list/hooks/use-list-url';

interface Props {
  state: ListState;
  update: UpdateList;
  clear: () => void;
  facets: EmployeeFacets | undefined;
  countryName: (code: string) => string;
  searchText: string;
  onSearchText: (text: string) => void;
}

export function EmployeesToolbar({
  state,
  update,
  clear,
  facets,
  countryName,
  searchText,
  onSearchText,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(
    state.employmentType.length > 0 || state.gender.length > 0,
  );
  const labelOf = (key: string) =>
    key === 'country' ? countryName : key === 'department' || key === 'jobTitle' ? String : label;

  const menu = (spec: (typeof FILTERS)[number]) => (
    <MultiSelect
      key={spec.key}
      name={spec.name}
      searchable={spec.searchable}
      options={facetOptions(facets?.[spec.key], labelOf(spec.key))}
      selected={state[spec.key]}
      onChange={(next) => update({ [spec.key]: next })}
    />
  );

  return (
    <div role="group" aria-label="Filters" className="space-y-2 border-b border-rule p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="search"
            aria-label="Search by name, email or code"
            placeholder="Search name, email or code…"
            autoComplete="off"
            spellCheck={false}
            value={searchText}
            onChange={(e) => onSearchText(e.target.value)}
            className="field pr-2.5 pl-8"
          />
        </div>
        {FILTERS.filter((f) => !f.secondary).map(menu)}
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
      {searchText.trim().length === 1 && (
        <p className="text-xs text-muted">Type at least 2 characters to search.</p>
      )}
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.filter((f) => f.secondary).map(menu)}
        </div>
      )}
    </div>
  );
}
