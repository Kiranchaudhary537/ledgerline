import type { Employee, StatsRow } from '@acme/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Failed } from '@/components/ui/states';
import { PayBand } from '@/features/employees/shared/components/PayBand';
import { bandPosition, POSITION_TEXT } from '@/features/employees/shared/model/band-geometry';
import { label, money } from '@/lib/format';
import { useTween } from '@/lib/tween';

interface BandState {
  data: StatsRow | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => void;
}

/** The figure to read first: current salary, where it sits in the pay band, and the one primary action. */
export function SalaryPanel({
  employee: e,
  band,
  countryName,
  onChangeSalary,
}: {
  employee: Employee;
  band: BandState;
  countryName: string;
  onChangeSalary: () => void;
}) {
  // The figure glides from the old salary to the new one after a change (and is static under reduced motion).
  const shown = useTween(e.salaryMinor);
  return (
    <Card className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground">Annual salary</p>
          <p
            className="tnum text-4xl font-semibold"
            aria-label={money(e.salaryMinor, e.countryCode)}
          >
            <span aria-hidden>{money(Math.round(shown), e.countryCode)}</span>
          </p>
        </div>
        <Button onClick={onChangeSalary}>Change salary</Button>
      </div>
      {band.error ? (
        <Failed error={band.error} retry={band.refetch} />
      ) : band.isPending ? (
        <Skeleton aria-hidden className="h-20 w-full" />
      ) : band.data ? (
        <>
          <PayBand
            band={band.data}
            countryCode={e.countryCode}
            points={[{ value: e.salaryMinor, kind: 'current' }]}
          />
          <p className="max-w-3xl text-muted-foreground">
            {e.jobTitle}, {label(e.level)}, {countryName}: middle half{' '}
            {money(band.data.p25, e.countryCode)} to {money(band.data.p75, e.countryCode)}, median{' '}
            {money(band.data.median, e.countryCode)}, {band.data.count} people. {e.fullName} is{' '}
            {POSITION_TEXT[bandPosition(e.salaryMinor, band.data)]}.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">
          No pay band yet: it appears once others hold the same role, level and country.
        </p>
      )}
    </Card>
  );
}
