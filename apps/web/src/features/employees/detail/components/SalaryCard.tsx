import type { Employee, StatsRow } from '@acme/shared';
import { Dot } from '@/components/ui/pill';
import { SegmentBar } from '@/components/ui/segment-bar';
import {
  BAND_MARKS,
  bandPosition,
  bandSegments,
  MARK_TONE,
  POSITION_TEXT,
} from '@/features/employees/shared/model/band-geometry';
import { label, money } from '@/lib/format';
import { Card } from '@/components/ui/card';

const MARK_LABEL = { min: 'Min', p25: 'P25', median: 'Median', p75: 'P75', max: 'Max' } as const;

export function SalaryCard({
  employee: e,
  band,
  countryName,
}: {
  employee: Employee;
  band: StatsRow | undefined;
  countryName: string;
}) {
  const { segments, marker } = band
    ? bandSegments(band, e.salaryMinor)
    : { segments: [], marker: undefined };
  return (
    <Card>
      <div className="space-y-5 p-6 pb-7">
        <div>
          <p className="text-sm text-muted-foreground">Annual salary</p>
          <p className="tnum text-3xl font-semibold">{money(e.salaryMinor, e.countryCode)}</p>
        </div>
        {band && (
          <>
            <dl className="tnum flex flex-wrap gap-x-8 gap-y-3" aria-label="Pay band">
              {BAND_MARKS.map((mark) => (
                <div key={mark}>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Dot tone={MARK_TONE[mark]} />
                    {MARK_LABEL[mark]}
                  </dt>
                  <dd className="font-semibold">{money(band[mark], e.countryCode)}</dd>
                </div>
              ))}
            </dl>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {e.jobTitle}, {label(e.level)}, {countryName}: middle half{' '}
              {money(band.p25, e.countryCode)} to {money(band.p75, e.countryCode)}, median{' '}
              {money(band.median, e.countryCode)}, {band.count} people. {e.fullName} is{' '}
              {POSITION_TEXT[bandPosition(e.salaryMinor, band)]}.
            </p>
          </>
        )}
      </div>
      {band && (
        <SegmentBar
          edge
          marker={marker}
          segments={segments.map((s) => ({ key: s.from, pct: s.pct, tone: MARK_TONE[s.from] }))}
        />
      )}
    </Card>
  );
}
