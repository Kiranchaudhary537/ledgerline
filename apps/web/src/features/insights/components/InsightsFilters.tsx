import type { FilterOptions } from '@acme/shared';
import { Button } from '@/components/ui/button';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { label } from '@/lib/format';
import type { InsightsState } from '@/features/insights/model/insights-state';

interface FiltersProps {
  state: InsightsState;
  options: FilterOptions | undefined;
  set: (patch: Partial<InsightsState>) => void;
}

export function InsightsFilters({ state, options, set }: FiltersProps) {
  const { country } = state;
  const departments: Option[] = (options?.departments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));
  const levels: Option[] = (options?.levels ?? []).map((v) => ({ value: v, label: label(v) }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="insights-country" className="text-muted-foreground">
        Pay in
      </label>
      <select
        id="insights-country"
        value={country}
        onChange={(e) => set({ country: e.target.value })}
        className="h-9 rounded-md border border-border bg-background px-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {country === '' && <option value="">Loading…</option>}
        {(options?.countries ?? []).map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <MultiSelect
        name="Department"
        options={departments}
        selected={state.department}
        onChange={(department) => set({ department })}
      />
      <MultiSelect
        name="Level"
        options={levels}
        selected={state.level}
        onChange={(level) => set({ level })}
      />
      {(state.department.length > 0 || state.level.length > 0) && (
        <Button variant="ghost" onClick={() => set({ department: [], level: [] })}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
