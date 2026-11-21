import type { FilterOptions, StatsRow } from '@acme/shared';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Failed } from '@/components/ui/states';
import { PayBand } from '@/features/employees/shared/components/PayBand';
import { roleOptions, type InsightsState } from '@/features/insights/model/insights-state';
import { formatCount, label, money } from '@/lib/format';

interface Props {
  state: InsightsState;
  options: FilterOptions | undefined;
  set: (patch: Partial<InsightsState>) => void;
  answer: { data: StatsRow[] | undefined; isPending: boolean; error: unknown; refetch: () => void };
}

const picker = 'inline-block h-10 max-w-full text-xl font-semibold';

/** The page's one question, as a sentence with pickers in it, and its answer as a pay band. */
export function PayQuestion({ state, options, set, answer }: Props) {
  const row = answer.data?.[0];
  return (
    <Card className="space-y-6 p-6">
      <h2 className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xl">
        What do we pay for
        <Select
          aria-label="Role"
          className={`${picker} w-80`}
          value={state.jobTitle}
          onChange={(e) => set({ jobTitle: e.target.value })}
        >
          <option value="">any role</option>
          {roleOptions(options?.departments).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Select
          aria-label="Level"
          className={`${picker} w-40`}
          value={state.level}
          onChange={(e) => set({ level: e.target.value })}
        >
          <option value="">any level</option>
          {(options?.levels ?? []).map((l) => (
            <option key={l} value={l}>
              {label(l)}
            </option>
          ))}
        </Select>
        in
        <Select
          aria-label="Country"
          className={`${picker} w-56`}
          value={state.country}
          onChange={(e) => set({ country: e.target.value })}
        >
          {state.country === '' && <option value="">Loading…</option>}
          {(options?.countries ?? []).map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
        ?
      </h2>
      {answer.error ? (
        <Failed error={answer.error} retry={answer.refetch} />
      ) : answer.isPending ? (
        <Skeleton aria-hidden className="h-28 w-full" />
      ) : row ? (
        <div role="status" aria-label="Answer" className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <p className="tnum text-4xl font-semibold">{money(row.median, state.country)}</p>
            <p className="text-muted-foreground">
              median, {formatCount(row.count)} {row.count === 1 ? 'person' : 'people'}
            </p>
          </div>
          <PayBand band={row} countryCode={state.country} />
          <p className="text-muted-foreground">
            Middle half {money(row.p25, state.country)} to {money(row.p75, state.country)}; lowest{' '}
            {money(row.min, state.country)}, highest {money(row.max, state.country)}.
          </p>
        </div>
      ) : (
        <EmptyState
          title="Nobody holds this role at this level here"
          description="The pay band appears once at least one person matches. Try another level or any role."
          action={{
            label: 'Show any role and level',
            onClick: () => set({ jobTitle: '', level: '' }),
          }}
        />
      )}
    </Card>
  );
}
