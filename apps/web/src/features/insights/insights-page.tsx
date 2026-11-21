import type { GenderGapRow, StatsRow } from '@acme/shared';
import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { railScale } from '@/features/employees/band-geometry';
import { BandRail } from '@/features/employees/band-rail';
import { MultiSelect, type Option } from '@/features/employees/multi-select';
import { useFilterOptions } from '@/features/employees/queries';
import { ApiError } from '@/lib/api';
import { formatCount, label, money } from '@/lib/format';
import { Histogram } from './histogram';
import { insightsToParams, parseInsightsState, type InsightsState } from './insights-state';
import { useDistribution, useGenderGap, useStats } from './queries';

const th =
  'border-b border-border pr-3 pb-1.5 text-left text-xs font-semibold text-muted-foreground';
const td = 'h-9 border-b border-border pr-3 whitespace-nowrap';

function Failed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 border-y border-border py-6">
      <p>{error instanceof ApiError ? error.message : 'Something went wrong.'}</p>
      <Button variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

function Skeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div aria-hidden className="space-y-0">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-9 items-center gap-6 border-b border-border">
          {Array.from({ length: cols }, (_c, j) => (
            <div key={j} className="h-3.5 flex-1 rounded-sm bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PayByRole({ rows, country }: { rows: StatsRow[]; country: string }) {
  const scale = useMemo(() => railScale(rows), [rows]);
  return (
    <div className="overflow-x-auto">
      <table aria-label="Pay by role" className="tnum w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={th}>
              Role
            </th>
            <th scope="col" className={th}>
              Level
            </th>
            <th scope="col" className={`${th} text-right`}>
              People
            </th>
            <th scope="col" className={`${th} w-1/2 min-w-48`}>
              Middle half of pay
            </th>
            <th scope="col" className={`${th} pr-0 text-right`}>
              Median
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const { jobTitle = '', level = '' } = r.group;
            const to = new URLSearchParams({ country, jobTitle, level });
            return (
              <tr key={`${jobTitle}/${level}`} className="hover:[&>td]:bg-band-soft/40">
                <td className={td}>
                  <Link
                    to={`/employees?${to}`}
                    className="font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {jobTitle}
                  </Link>
                </td>
                <td className={td}>{label(level)}</td>
                <td className={`${td} text-right`}>{formatCount(r.count)}</td>
                <td className="h-9 w-1/2 min-w-48 border-b border-border pr-6">
                  <BandRail
                    band={r}
                    countryCode={country}
                    markers={[]}
                    scale={scale}
                    showLabels={false}
                  />
                </td>
                <td className={`${td} pr-0 text-right`}>{money(r.median, country)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const gapText = (pct: number) =>
  pct > 0
    ? `${pct}% (women paid less)`
    : pct < 0
      ? `${Math.abs(pct)}% (women paid more)`
      : '0% (no gap)';

function GenderGap({ rows, country }: { rows: GenderGapRow[]; country: string }) {
  const side = (n: number, median: number | null) =>
    n === 0 || median === null ? (
      <span className="text-muted-foreground">No one</span>
    ) : (
      <>
        {money(median, country)}
        <span className="text-xs text-muted-foreground"> ({formatCount(n)})</span>
      </>
    );
  return (
    <div className="overflow-x-auto">
      <table aria-label="Gender gap by role" className="tnum w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={th}>
              Role
            </th>
            <th scope="col" className={`${th} text-right`}>
              Women, median (people)
            </th>
            <th scope="col" className={`${th} text-right`}>
              Men, median (people)
            </th>
            <th scope="col" className={`${th} pr-0 text-right`}>
              Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.group.jobTitle}>
              <td className={td}>{r.group.jobTitle}</td>
              <td className={`${td} text-right`}>{side(r.femaleCount, r.femaleMedian)}</td>
              <td className={`${td} text-right`}>{side(r.maleCount, r.maleMedian)}</td>
              <td className={`${td} pr-0 text-right`}>
                {r.gapPct === null ? (
                  <span className="text-muted-foreground">Not enough data</span>
                ) : (
                  gapText(r.gapPct)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InsightsPage() {
  const [params, setParams] = useSearchParams();
  const url = useMemo(() => parseInsightsState(params), [params]);
  const options = useFilterOptions();

  const overview = useStats({ country: '', department: [], level: [] }, 'country');
  const biggest = overview.data?.reduce<StatsRow | undefined>(
    (a, r) => (!a || r.count > a.count ? r : a),
    undefined,
  )?.group.country;
  const country = url.country || biggest || '';
  const state: InsightsState = { ...url, country };
  const ready = country !== '';

  const summary = useStats(state, 'country', ready);
  const roles = useStats(state, 'jobTitle,level', ready);
  const gap = useGenderGap(state, ready);
  const dist = useDistribution(state, ready);

  const set = (patch: Partial<InsightsState>) =>
    setParams(insightsToParams({ ...state, ...patch }));

  const countries = options.data?.countries ?? [];
  const departments: Option[] = (options.data?.departments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));
  const levels: Option[] = (options.data?.levels ?? []).map((v) => ({ value: v, label: label(v) }));
  const countryName = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  const total = summary.data?.[0];
  const empty = roles.data?.length === 0;
  const loading = !ready || roles.isPending;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Insights</h1>
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
            {countries.map((c) => (
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
        <p className="tnum min-h-6" aria-live="polite">
          {total && (
            <>
              <strong className="font-semibold">{formatCount(total.count)} people</strong>
              <span className="mx-3 text-muted-foreground">
                Median {money(total.median, country)}
              </span>
              <span className="text-muted-foreground">
                Annual payroll {money(total.total, country)}
              </span>
            </>
          )}
        </p>
      </div>

      {roles.isError ? (
        <Failed error={roles.error} retry={() => void roles.refetch()} />
      ) : empty ? (
        <div className="space-y-3 py-6">
          <p className="text-lg font-semibold">No people match these filters</p>
          <Button variant="secondary" onClick={() => set({ department: [], level: [] })}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <Section title="Pay by role">
            <p className="text-muted-foreground">
              Every rail uses the same scale. Open a role to see its people.
            </p>
            {loading ? (
              <>
                <Skeleton rows={8} cols={5} />
                <p className="sr-only">Loading pay by role…</p>
              </>
            ) : (
              <PayByRole rows={roles.data ?? []} country={country} />
            )}
          </Section>

          <Section title="Salary distribution">
            {dist.isError ? (
              <Failed error={dist.error} retry={() => void dist.refetch()} />
            ) : dist.data && dist.data.buckets.length > 0 ? (
              <Histogram
                data={dist.data}
                countryCode={country}
                name={`Salaries in ${countryName(country)}`}
              />
            ) : (
              <div
                aria-hidden
                className="h-44 max-w-2xl rounded-sm bg-muted motion-safe:animate-pulse"
              />
            )}
          </Section>

          <Section title="Gender gap by role">
            <p className="text-muted-foreground">
              Gap is the men’s median minus the women’s, as a share of the men’s. A positive gap
              means women are paid less. Shown when each group has at least 5 people.
            </p>
            {gap.isError ? (
              <Failed error={gap.error} retry={() => void gap.refetch()} />
            ) : gap.data ? (
              <GenderGap rows={gap.data} country={country} />
            ) : (
              <Skeleton rows={5} cols={4} />
            )}
          </Section>
        </>
      )}

      <Section title="Countries">
        {overview.isError ? (
          <Failed error={overview.error} retry={() => void overview.refetch()} />
        ) : overview.data ? (
          <div className="overflow-x-auto">
            <table aria-label="Countries overview" className="tnum w-full max-w-xl border-collapse">
              <thead>
                <tr>
                  <th scope="col" className={th}>
                    Country
                  </th>
                  <th scope="col" className={`${th} text-right`}>
                    People
                  </th>
                  <th scope="col" className={`${th} pr-0 text-right`}>
                    Median
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.data.map((r) => {
                  const code = r.group.country ?? '';
                  return (
                    <tr key={code}>
                      <td className={td}>{countryName(code)}</td>
                      <td className={`${td} text-right`}>{formatCount(r.count)}</td>
                      <td className={`${td} pr-0 text-right`}>{money(r.median, code)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Skeleton rows={5} cols={3} />
        )}
      </Section>
    </div>
  );
}
