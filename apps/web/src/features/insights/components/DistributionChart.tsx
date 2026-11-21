import type { Distribution } from '@acme/shared';
import { Bar, BarChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { bucketIndex } from '@/features/insights/model/histogram-geometry';
import { formatCount, money } from '@/lib/format';
import { motionMs, prefersReducedMotion } from '@/lib/tween';

type Bucket = Distribution['buckets'][number];

/** The middle half and the median of the same people, drawn behind the bars. */
export interface Spread {
  p25: number;
  median: number;
  p75: number;
}

const config = { count: { label: 'People', color: 'var(--color-chart-2)' } } satisfies ChartConfig;

/** Salary histogram: bars on the baseline, the middle half shaded, the median as a line, a table behind it. */
export function DistributionChart({
  data,
  countryCode,
  name,
  spread,
}: {
  data: Distribution;
  countryCode: string;
  name: string;
  spread: Spread | undefined;
}) {
  const { buckets } = data;
  const range = (b: Bucket) => `${money(b.from, countryCode)} to ${money(b.to, countryCode)}`;
  const rows = buckets.map((b) => ({
    label: money(b.from, countryCode),
    range: range(b),
    count: b.count,
  }));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const tallest = buckets.reduce((a, b) => (b.count > a.count ? b : a));
  const at = (v: number) => rows[bucketIndex(buckets, v)]?.label;
  const [p25, p75, median] = spread ? [at(spread.p25), at(spread.p75), at(spread.median)] : [];

  return (
    <div className="px-3 pb-4">
      <ChartContainer
        config={config}
        role="img"
        aria-label={`${name}: ${formatCount(total)} people in ${buckets.length} salary ranges, most common ${range(tallest)}.${spread ? ` Median ${money(spread.median, countryCode)}, middle half ${money(spread.p25, countryCode)} to ${money(spread.p75, countryCode)}.` : ''}`}
        className="aspect-auto h-60 w-full"
      >
        <BarChart
          data={rows}
          barCategoryGap={2}
          margin={{ top: 20, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} />
          {p25 && p75 && (
            <ReferenceArea x1={p25} x2={p75} fill="var(--color-band-soft)" fillOpacity={0.8} />
          )}
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis width={40} tickLine={false} axisLine={false} tickFormatter={formatCount} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideIndicator labelKey="range" />}
          />
          {median && (
            <ReferenceLine
              x={median}
              stroke="var(--color-band)"
              strokeWidth={2}
              label={{
                value: `Median ${money(spread?.median ?? 0, countryCode)}`,
                position: 'top',
                fill: 'var(--color-band)',
                fontSize: 12,
              }}
            />
          )}
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            isAnimationActive={!prefersReducedMotion()}
            animationDuration={motionMs('--dur-chart', 360)}
            animationEasing="ease-out"
          />
        </BarChart>
      </ChartContainer>
      {spread && (
        <p className="mt-1 text-xs text-muted-foreground">
          Shaded band: the middle half of salaries (p25 to p75). Line: the median.
        </p>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View as table
        </summary>
        <table className="tnum mt-2 w-full max-w-md border-collapse">
          <caption className="sr-only">{name}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b pb-1.5 text-left text-xs font-medium text-muted-foreground"
              >
                Salary range
              </th>
              <th
                scope="col"
                className="border-b pb-1.5 text-right text-xs font-medium text-muted-foreground"
              >
                People
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="h-8 border-b">{r.range}</td>
                <td className="h-8 border-b text-right">{formatCount(r.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
