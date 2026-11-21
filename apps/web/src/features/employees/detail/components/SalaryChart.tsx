import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { EmptyState, Failed } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { salarySteps, type HistoryRow } from '@/features/employees/detail/model/history';
import { formatDate, money } from '@/lib/format';
import { motionMs, prefersReducedMotion } from '@/lib/tween';

const config = {
  salaryMinor: { label: 'Salary', color: 'var(--color-chart-1)' },
} satisfies ChartConfig;

const monthYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Salary over time as a step line: it holds each salary until the next change, then runs to today. */
export function SalaryChart({
  rows,
  error,
  onRetry,
  countryCode,
  name,
}: {
  rows: HistoryRow[] | undefined;
  error: unknown;
  onRetry: () => void;
  countryCode: string;
  name: string;
}) {
  const steps = rows ? salarySteps(rows, Date.now()) : [];
  const last = steps.length - 1;
  return (
    <Card role="region" aria-labelledby="chart-title">
      <CardHeader className="pb-2">
        <CardTitle id="chart-title">Salary over time</CardTitle>
      </CardHeader>
      {error ? (
        <Failed error={error} retry={onRetry} />
      ) : !rows ? (
        <Skeleton aria-hidden className="m-5 h-52" />
      ) : rows.length < 2 ? (
        // A single starting salary is a flat line: nothing to read until pay changes.
        <EmptyState
          title="No salary changes since joining"
          description="The chart appears after the first change."
        />
      ) : (
        <div className="px-3 pb-4">
          <ChartContainer
            config={config}
            role="img"
            aria-label={`${name}: salary over time, from ${money(steps[0]!.salaryMinor, countryCode)} to ${money(steps[last]!.salaryMinor, countryCode)} in ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}. The history below lists every change.`}
            className="aspect-auto h-56 w-full"
          >
            <LineChart data={steps} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="at"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(t: number) => monthYear.format(t)}
                minTickGap={48}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                width={88}
                tickCount={4}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => money(v, countryCode)}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, p) => formatDate(new Date(p[0]?.payload.at).toISOString())}
                    formatter={(v) => money(Number(v), countryCode)}
                  />
                }
              />
              <Line
                dataKey="salaryMinor"
                type="stepAfter"
                stroke="var(--color-salaryMinor)"
                strokeWidth={2}
                dot={({ cx = 0, cy = 0, index }) =>
                  index === last ? (
                    <g key={index} />
                  ) : (
                    <rect
                      key={index}
                      x={cx - 3}
                      y={cy - 3}
                      width={6}
                      height={6}
                      fill="var(--color-salaryMinor)"
                    />
                  )
                }
                isAnimationActive={!prefersReducedMotion()}
                animationDuration={motionMs('--dur-chart', 360)}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
          <table className="sr-only">
            <caption>{name}: salary over time</caption>
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">Salary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.changedAt)}</td>
                  <td>{money(r.newMinor, countryCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
