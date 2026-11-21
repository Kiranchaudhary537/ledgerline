import type { FilterOptions } from '@acme/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { Select } from '@/components/ui/input';
import { label } from '@/lib/format';
import type { InsightsState } from '@/features/insights/model/insights-state';

interface Props {
  state: InsightsState;
  options: FilterOptions | undefined;
  set: (patch: Partial<InsightsState>) => void;
}

export function InsightsToolbar({ state, options, set }: Props) {
  const departments: Option[] = (options?.departments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));
  const levels: Option[] = (options?.levels ?? []).map((v) => ({ value: v, label: label(v) }));

  return (
    <Card className="flex flex-wrap items-center gap-2 p-4">
      <label htmlFor="insights-country" className="text-muted">
        Pay in
      </label>
      <Select
        id="insights-country"
        value={state.country}
        onChange={(e) => set({ country: e.target.value })}
        className="w-48"
      >
        {state.country === '' && <option value="">Loading…</option>}
        {(options?.countries ?? []).map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>
      <MultiSelect
        name="Department"
        searchable
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
    </Card>
  );
}
