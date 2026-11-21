import type { GenderGapRow } from '@acme/shared';
import { Table, Td, Th } from '@/components/ui/table';
import { gapLimit, gapPosition, sortByGap } from '@/features/insights/model/gap-geometry';
import { formatCount, money } from '@/lib/format';

/** The number and its direction in words, so colour and position never carry the meaning alone. */
const gapParts = (pct: number) =>
  pct > 0
    ? { value: `${pct}%`, note: 'women paid less' }
    : pct < 0
      ? { value: `${Math.abs(pct)}%`, note: 'women paid more' }
      : { value: '0%', note: 'no gap' };

const medians = (r: GenderGapRow, country: string) =>
  `Women ${r.femaleMedian === null ? 'none' : money(r.femaleMedian, country)} (${formatCount(r.femaleCount)}), ` +
  `men ${r.maleMedian === null ? 'none' : money(r.maleMedian, country)} (${formatCount(r.maleCount)})`;

function GapText({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">Not enough data</span>;
  const { value, note } = gapParts(pct);
  return (
    <>
      <span className="font-semibold">{value}</span>{' '}
      <span className="text-muted-foreground">{note}</span>
    </>
  );
}

function Track({ pct, limit }: { pct: number | null; limit: number }) {
  const at = pct === null ? 50 : gapPosition(limit, pct);
  return (
    <div aria-hidden className="relative h-8">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <div className="absolute inset-y-1 left-1/2 w-px bg-muted-foreground" />
      {pct !== null && (
        <>
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-band-soft"
            style={{ left: `${Math.min(50, at)}%`, width: `${Math.abs(at - 50)}%` }}
          />
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${at}%` }}
          />
        </>
      )}
    </div>
  );
}

const rowGrid = 'grid grid-cols-[minmax(8rem,15rem)_1fr_minmax(10rem,13rem)] items-center gap-4';

/** One dot per role on a shared axis. Zero is the centre; right of it women are paid less. */
function GapDotPlot({ rows, country }: { rows: GenderGapRow[]; country: string }) {
  const limit = gapLimit(rows);
  return (
    <div className="px-5">
      <div
        aria-hidden
        className={`${rowGrid} border-b border-border pb-1 text-xs text-muted-foreground`}
      >
        <span />
        <span className="tnum flex justify-between">
          <span>{limit}% women paid more</span>
          <span>0</span>
          <span>{limit}% women paid less</span>
        </span>
        <span />
      </div>
      <ul aria-label="Gender gap by role">
        {sortByGap(rows).map((r) => (
          <li
            key={r.group.jobTitle}
            title={medians(r, country)}
            className={`${rowGrid} border-b border-border last:border-b-0`}
          >
            <span className="truncate">{r.group.jobTitle}</span>
            <Track pct={r.gapPct} limit={limit} />
            <span className="tnum text-right">
              <GapText pct={r.gapPct} />
            </span>
          </li>
        ))}
      </ul>
    </div>
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
    <details className="border-t border-border">
      <summary className="cursor-pointer px-5 py-3 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
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

export function GenderGapPlot({ rows, country }: { rows: GenderGapRow[]; country: string }) {
  if (rows.length === 0) {
    return (
      <p className="px-5 pb-5 text-muted-foreground">No roles to compare for these filters.</p>
    );
  }
  return (
    <>
      <GapDotPlot rows={rows} country={country} />
      <GapTable rows={rows} country={country} />
    </>
  );
}
