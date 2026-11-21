import type { InsightsStatsRow } from '@acme/shared';
import { formatCount, money } from '@/lib/format';

const share = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
/** "6%" for 3 of 50. */
export const outsideShare = (r: InsightsStatsRow) =>
  `${share.format((r.outOfBandCount / r.count) * 100)}%`;

/** One sentence-style line: the quiet header for the chosen country and filters. */
export function Scorecard({
  total,
  country,
}: {
  total: InsightsStatsRow | undefined;
  country: string;
}) {
  return (
    <p role="status" aria-label="Scorecard" className="tnum min-h-6 text-muted-foreground">
      {total && (
        <>
          <strong className="font-semibold text-foreground">
            {formatCount(total.count)} people
          </strong>
          <span className="ml-4">Median {money(total.median, country)}</span>
          <span className="ml-4">Annual payroll {money(total.total, country)}</span>
          <span className="ml-4">Average compa-ratio {total.avgCompaRatio.toFixed(2)}</span>
          <span className="ml-4">
            <strong className="font-semibold text-foreground">
              {outsideShare(total)} outside their band
            </strong>{' '}
            ({formatCount(total.outOfBandCount)})
          </span>
        </>
      )}
    </p>
  );
}
