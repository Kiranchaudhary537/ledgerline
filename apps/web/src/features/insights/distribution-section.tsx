import { Histogram, type Spread } from './histogram';
import { Failed, Section } from './insights-ui';
import type { useDistribution } from './queries';

export function DistributionSection({
  dist,
  country,
  countryName,
  spread,
}: {
  dist: ReturnType<typeof useDistribution>;
  country: string;
  countryName: string;
  spread: Spread | undefined;
}) {
  return (
    <Section title="Salary distribution">
      {dist.isError ? (
        <Failed error={dist.error} retry={() => void dist.refetch()} />
      ) : dist.data && dist.data.buckets.length > 0 ? (
        <Histogram
          data={dist.data}
          countryCode={country}
          name={`Salaries in ${countryName}`}
          spread={spread}
        />
      ) : (
        <div aria-hidden className="h-44 max-w-2xl rounded-sm bg-muted motion-safe:animate-pulse" />
      )}
    </Section>
  );
}
