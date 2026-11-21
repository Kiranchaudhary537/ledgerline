import { config, type Employee } from '@acme/shared';
import { Link } from 'react-router';
import { CompaRatioCell } from '@/features/employees/list/components/CompaRatioCell';
import { label, money } from '@/lib/format';
import type { InsightsState } from '@/features/insights/model/insights-state';
import { Failed, Section, Skeleton } from '@/features/insights/components/Section';
import { outlierParams, type Side, useOutliers } from '@/features/insights/api/queries';

const { extremeLow, extremeHigh } = config.compaRatio;

const SIDES = {
  asc: {
    title: 'Furthest below band',
    none: 'Nobody is below their band.',
    keep: (e: Employee) => e.compaRatio < extremeLow,
  },
  desc: {
    title: 'Furthest above band',
    none: 'Nobody is above their band.',
    keep: (e: Employee) => e.compaRatio > extremeHigh,
  },
} as const;

const linkFocus =
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function Person({ e }: { e: Employee }) {
  return (
    <li className="flex items-center gap-4 border-b border-border py-2">
      <span className="w-16 shrink-0 text-xl leading-none">
        <CompaRatioCell value={e.compaRatio} />
      </span>
      <span className="min-w-0 flex-1">
        <Link to={`/employees/${e.id}`} className={`block truncate font-semibold ${linkFocus}`}>
          {e.fullName}
        </Link>
        <span className="block truncate text-muted-foreground">
          {e.jobTitle}, {label(e.level)}
        </span>
      </span>
      <span className="tnum shrink-0 text-right">{money(e.salaryMinor, e.countryCode)}</span>
    </li>
  );
}

function SidePanel({ state, side, ready }: { state: InsightsState; side: Side; ready: boolean }) {
  const { title, none, keep } = SIDES[side];
  const q = useOutliers(state, side, ready);
  const people = q.data?.data.filter(keep) ?? [];
  return (
    <section aria-label={title} className="space-y-1">
      <div className="flex items-baseline justify-between border-b border-foreground pb-1.5">
        <h3 className="font-semibold">{title}</h3>
        {people.length > 0 && (
          <Link
            to={`/employees?${outlierParams(state, side)}`}
            className={`text-muted-foreground hover:text-foreground ${linkFocus}`}
          >
            See all
          </Link>
        )}
      </div>
      {q.isError ? (
        <Failed error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <Skeleton rows={config.insights.attentionCount} cols={3} />
      ) : people.length === 0 ? (
        <p className="py-4 text-muted-foreground">{none}</p>
      ) : (
        <ul>
          {people.map((e) => (
            <Person key={e.id} e={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AttentionSection({ state, ready }: { state: InsightsState; ready: boolean }) {
  return (
    <Section title="Needs attention" lead>
      <p className="max-w-2xl text-muted-foreground">
        Compa-ratio is pay divided by the median for the same country, title, level and employment
        type. People under {extremeLow.toFixed(2)} or over {extremeHigh.toFixed(2)} are outside
        their band.
      </p>
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
        <SidePanel state={state} side="asc" ready={ready} />
        <SidePanel state={state} side="desc" ready={ready} />
      </div>
    </Section>
  );
}
