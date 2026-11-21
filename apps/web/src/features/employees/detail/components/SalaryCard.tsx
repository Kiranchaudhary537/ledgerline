import type { Employee, StatsRow } from '@acme/shared';
import { Swatch } from '@/components/ui/pill';
import { SegmentBar } from '@/components/ui/segment-bar';
import {
  BAND_MARKS,
  bandPosition,
  bandSegments,
  MARK_STEP,
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
      <div className="space-y-5 p-6">
        <div>
          <p className="text-sm text-muted">Annual salary</p>
          <p className="tnum font-display text-3xl font-semibold tracking-display">
            {money(e.salaryMinor, e.countryCode)}
          </p>
        </div>
        {band && (
          <>
            <SegmentBar
              className="h-2.5"
              marker={marker}
              segments={segments.map((s) => ({ key: s.from, pct: s.pct, step: MARK_STEP[s.from] }))}
            />
            <dl className="tnum flex flex-wrap gap-x-8 gap-y-3" aria-label="Pay band">
              {BAND_MARKS.map((mark) => (
                <div key={mark}>
                  <dt className="flex items-center gap-1.5 text-xs text-muted">
                    <Swatch step={MARK_STEP[mark]} />
                    {MARK_LABEL[mark]}
                  </dt>
                  <dd className="font-medium">{money(band[mark], e.countryCode)}</dd>
                </div>
              ))}
            </dl>
            <p className="max-w-3xl text-sm text-muted">
              {e.jobTitle}, {label(e.level)}, {countryName}: middle half{' '}
              {money(band.p25, e.countryCode)} to {money(band.p75, e.countryCode)}, median{' '}
              {money(band.median, e.countryCode)}, {band.count} people. {e.fullName} is{' '}
              {POSITION_TEXT[bandPosition(e.salaryMinor, band)]}.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
