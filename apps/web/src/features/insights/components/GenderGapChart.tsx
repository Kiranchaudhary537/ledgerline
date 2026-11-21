import type { GenderGapRow } from '@acme/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Table, Td, Th } from '@/components/ui/table';
import { gapLimit, gapParts, sortByGap } from '@/features/insights/model/gap-geometry';
import { formatCount, money } from '@/lib/format';
import { motionMs, prefersReducedMotion } from '@/lib/tween';

const config = { gapPct: { label: 'Gap', color: 'var(--color-chart-3)' } } satisfies ChartConfig;

function GapText({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">Not enough data</span>;
  const { value, note } = gapParts(pct);
  return (
    <>
      <span className="font-medium">{value}</span>{' '}
      <span className="text-muted-foreground">{note}</span>
    </>
  );
}

function GapTable({ rows, country }: { rows: GenderGapRow[]; country: string }) {
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
    <details className="border-t">
      <summary className="cursor-pointer px-5 py-3 text-muted-foreground hover:text-foreground">
        View as table
      </summary>
      <div className="overflow-x-auto">
        <Table aria-label="Gender gap by role">
          <thead>
            <tr>
              <Th>Role</Th>
              <Th align="right">Women, median (people)</Th>
              <Th align="right">Men, median (people)</Th>
              <Th align="right">Gap</Th>
            </tr>
          </thead>
          <tbody>
            {sortByGap(rows).map((r) => (
              <tr key={r.group.jobTitle}>
                <Td>{r.group.jobTitle}</Td>
                <Td align="right">{side(r.femaleCount, r.femaleMedian)}</Td>
                <Td align="right">{side(r.maleCount, r.maleMedian)}</Td>
                <Td align="right">
                  <GapText pct={r.gapPct} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </details>
  );
}

const ROW_PX = 30;

/** One bar per role: right of zero women are paid less, left of it more. Roles without enough people are listed, not plotted. */
export function GenderGapChart({ rows, country }: { rows: GenderGapRow[]; country: string }) {
  if (rows.length === 0) {
    return (
      <p className="px-5 pb-5 text-muted-foreground">No roles to compare for these filters.</p>
    );
  }
  const sorted = sortByGap(rows);
  const plotted = sorted.flatMap((r) =>
    r.gapPct === null ? [] : [{ role: r.group.jobTitle ?? '', gapPct: r.gapPct }],
  );
  const skipped = sorted.filter((r) => r.gapPct === null).map((r) => r.group.jobTitle);
  const limit = gapLimit(rows);
  return (
    <>
      <div className="px-3 pb-3">
        {plotted.length > 0 && (
          <ChartContainer
            config={config}
            role="img"
            aria-label={`Gender gap by role: ${plotted.map((p) => `${p.role} ${gapParts(p.gapPct).value} ${gapParts(p.gapPct).note}`).join(', ')}.`}
            className="aspect-auto w-full"
            style={{ height: plotted.length * ROW_PX + 48 }}
          >
            <BarChart
              layout="vertical"
              data={plotted}
              margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                domain={[-limit, limit]}
                tickFormatter={(v: number) => `${v}%`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis type="category" dataKey="role" width={150} tickLine={false} axisLine={false} />
              <ReferenceLine x={0} stroke="var(--color-foreground)" />
              <Bar
                dataKey="gapPct"
                barSize={14}
                isAnimationActive={!prefersReducedMotion()}
                animationDuration={motionMs('--dur-chart', 360)}
                animationEasing="ease-out"
              >
                {plotted.map((p) => (
                  <Cell
                    key={p.role}
                    fill={p.gapPct >= 0 ? 'var(--color-chart-3)' : 'var(--color-chart-2)'}
                  />
                ))}
                <LabelList
                  dataKey="gapPct"
                  position="right"
                  formatter={(v: unknown) => `${Number(v)}%`}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
        <p className="px-2 text-xs text-muted-foreground">
          Right of zero (clay): women paid less. Left (grey): women paid more.
          {skipped.length > 0 && ` Not enough data: ${skipped.join(', ')}.`}
        </p>
      </div>
      <GapTable rows={rows} country={country} />
    </>
  );
}
