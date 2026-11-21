import type { StatsRow } from '@acme/shared';
import { Card } from '@/components/ui/card';
import { Dot } from '@/components/ui/pill';
import { SegmentBar } from '@/components/ui/segment-bar';
import { bandSegments, MARK_TONE } from '@/features/employees/shared/model/band-geometry';
import { formatCount, money } from '@/lib/format';

/** Headcount, median and payroll for the chosen country, with its pay range as a bar on the bottom edge. */
export function SummaryCard({
  total,
  country,
  countryName,
}: {
  total: StatsRow | undefined;
  country: string;
  countryName: string;
}) {
  const { segments } = total ? bandSegments(total) : { segments: [] };
  return (
    <Card role="status" aria-label="Summary" className="min-h-36">
      {total && (
        <>
          <div className="space-y-5 p-6 pb-7">
            <div>
              <p className="text-sm text-muted-foreground">Annual payroll in {countryName}</p>
              <p className="tnum text-3xl font-semibold">{money(total.total, country)}</p>
            </div>
            <dl className="tnum flex flex-wrap gap-x-10 gap-y-3">
              <Figure tone={4} term="People">
                {formatCount(total.count)}
              </Figure>
              <Figure tone={MARK_TONE.p25} term="Lower quarter (p25)">
                {money(total.p25, country)}
              </Figure>
              <Figure tone={MARK_TONE.median} term="Median">
                {money(total.median, country)}
              </Figure>
              <Figure tone={MARK_TONE.p75} term="Upper quarter (p75)">
                {money(total.p75, country)}
              </Figure>
            </dl>
          </div>
          <SegmentBar
            edge
            segments={segments.map((s) => ({ key: s.from, pct: s.pct, tone: MARK_TONE[s.from] }))}
          />
        </>
      )}
    </Card>
  );
}

function Figure({ term, tone, children }: { term: string; tone: number; children: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Dot tone={tone} />
        {term}
      </dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}
