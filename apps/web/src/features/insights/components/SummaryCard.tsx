import type { StatsRow } from '@acme/shared';
import { Card } from '@/components/ui/card';
import { Swatch } from '@/components/ui/pill';
import { SegmentBar } from '@/components/ui/segment-bar';
import { bandSegments, MARK_STEP } from '@/features/employees/shared/model/band-geometry';
import { formatCount, money } from '@/lib/format';

/** Headcount, median and payroll for the chosen country, with its pay range as the band bar. */
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
        <div className="space-y-5 p-6">
          <div>
            <p className="text-sm text-muted">Annual payroll in {countryName}</p>
            <p className="tnum font-display text-3xl font-semibold tracking-display">
              {money(total.total, country)}
            </p>
          </div>
          <SegmentBar
            segments={segments.map((s) => ({ key: s.from, pct: s.pct, step: MARK_STEP[s.from] }))}
          />
          <dl className="tnum flex flex-wrap gap-x-10 gap-y-3">
            <Figure term="People">{formatCount(total.count)}</Figure>
            <Figure step={MARK_STEP.p25} term="Lower quarter (p25)">
              {money(total.p25, country)}
            </Figure>
            <Figure step={MARK_STEP.median} term="Median">
              {money(total.median, country)}
            </Figure>
            <Figure step={MARK_STEP.p75} term="Upper quarter (p75)">
              {money(total.p75, country)}
            </Figure>
          </dl>
        </div>
      )}
    </Card>
  );
}

function Figure({ term, step, children }: { term: string; step?: number; children: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        {step !== undefined && <Swatch step={step} />}
        {term}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
