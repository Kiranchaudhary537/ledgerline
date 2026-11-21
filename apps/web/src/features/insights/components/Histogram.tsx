import type { Distribution } from '@acme/shared';
import { formatCount, money } from '@/lib/format';
import { valueX } from '@/features/insights/model/histogram-geometry';

/** SVG layout in viewBox units (not a tunable): total size and the margins left for axis labels. */
const CHART = { W: 560, H: 190, LEFT: 36, TOP: 18, BOTTOM: 22 };
const { W, H, LEFT, TOP, BOTTOM } = CHART;

type Bucket = Distribution['buckets'][number];
/** The middle half and the median of the same people, drawn behind the bars. */
export interface Spread {
  p25: number;
  median: number;
  p75: number;
}

/** Salary histogram: one colour, bars anchored to the baseline, a table view for exact numbers. */
export function Histogram({
  data,
  countryCode,
  name,
  spread,
}: {
  data: Distribution;
  countryCode: string;
  name: string;
  spread?: Spread;
}) {
  const { buckets } = data;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const bw = (W - LEFT) / buckets.length;
  const y = (v: number) => H - BOTTOM - (v / max) * (H - BOTTOM - TOP);
  const range = (b: Bucket) => `${money(b.from, countryCode)} to ${money(b.to, countryCode)}`;
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const tallest = buckets.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${name}: ${formatCount(total)} people in ${buckets.length} salary ranges, most common ${range(tallest)}.${spread ? ` Median ${money(spread.median, countryCode)}, middle half ${money(spread.p25, countryCode)} to ${money(spread.p75, countryCode)}.` : ''}`}
        className="block h-auto w-full max-w-2xl"
      >
        {spread && (
          <SpreadMarks spread={spread} buckets={buckets} countryCode={countryCode} y0={y(0)} />
        )}
        {[0, max].map((t) => (
          <text
            key={t}
            x={LEFT - 6}
            y={y(t) + 4}
            textAnchor="end"
            className="tnum fill-muted-foreground text-[11px]"
          >
            {formatCount(t)}
          </text>
        ))}
        <line x1={LEFT} x2={W} y1={y(0)} y2={y(0)} className="stroke-border" />
        {buckets.map((b, i) => (
          <rect
            key={b.from}
            x={LEFT + i * bw + 1}
            y={y(b.count)}
            width={Math.max(bw - 2, 1)}
            height={y(0) - y(b.count)}
            rx={2}
            className="fill-primary"
          >
            <title>{`${range(b)}: ${formatCount(b.count)} people`}</title>
          </rect>
        ))}
        <XAxisLabels buckets={buckets} bw={bw} countryCode={countryCode} />
      </svg>
      {spread && (
        <p className="mt-1 text-xs text-muted-foreground">
          Shaded band: the middle half of salaries (p25 to p75). Line: the median.
        </p>
      )}
      <DistributionTable buckets={buckets} name={name} range={range} />
    </div>
  );
}

function SpreadMarks({
  spread,
  buckets,
  countryCode,
  y0,
}: {
  spread: Spread;
  buckets: Bucket[];
  countryCode: string;
  y0: number;
}) {
  const x = (v: number) => valueX(buckets, v, LEFT, W);
  const median = x(spread.median);
  const flip = median > W - 150;
  return (
    <g>
      <rect
        x={x(spread.p25)}
        y={TOP}
        width={x(spread.p75) - x(spread.p25)}
        height={y0 - TOP}
        className="fill-band-soft"
      >
        <title>{`Middle half of pay: ${money(spread.p25, countryCode)} to ${money(spread.p75, countryCode)}`}</title>
      </rect>
      <line x1={median} x2={median} y1={TOP - 4} y2={y0} className="stroke-foreground" />
      <text
        x={median + (flip ? -5 : 5)}
        y={TOP - 6}
        textAnchor={flip ? 'end' : 'start'}
        className="tnum fill-foreground text-[11px] font-semibold"
      >
        {`Median ${money(spread.median, countryCode)}`}
      </text>
    </g>
  );
}

/** First, middle and last bucket edges; the last label is the upper edge and right-aligned. */
function XAxisLabels({
  buckets,
  bw,
  countryCode,
}: {
  buckets: Bucket[];
  bw: number;
  countryCode: string;
}) {
  const ticks = [...new Set([0, Math.floor(buckets.length / 2), buckets.length - 1])];
  return (
    <>
      {ticks.map((i) => {
        const last = i === buckets.length - 1 && i > 0;
        return (
          <text
            key={i}
            x={last ? W : LEFT + i * bw}
            y={H - 6}
            textAnchor={i === 0 ? 'start' : last ? 'end' : 'middle'}
            className="tnum fill-muted-foreground text-[11px]"
          >
            {money(last ? buckets[i]!.to : buckets[i]!.from, countryCode)}
          </text>
        );
      })}
    </>
  );
}

function DistributionTable({
  buckets,
  name,
  range,
}: {
  buckets: Bucket[];
  name: string;
  range: (b: Bucket) => string;
}) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        View as table
      </summary>
      <table className="tnum mt-2 w-full max-w-md border-collapse">
        <caption className="sr-only">{name}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b border-border pb-1.5 text-left text-xs font-semibold text-muted-foreground"
            >
              Salary range
            </th>
            <th
              scope="col"
              className="border-b border-border pb-1.5 text-right text-xs font-semibold text-muted-foreground"
            >
              People
            </th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.from}>
              <td className="h-8 border-b border-border">{range(b)}</td>
              <td className="h-8 border-b border-border text-right">{formatCount(b.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
