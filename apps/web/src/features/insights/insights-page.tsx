import { Button } from '@/components/ui/button';
import { useFilterOptions } from '@/features/employees/queries';
import { CountriesSection } from './countries-section';
import { DistributionSection } from './distribution-section';
import { GenderGapSection } from './gender-gap-section';
import { AttentionSection } from './attention-section';
import { InsightsFilters } from './insights-filters';
import { Failed, Section, Skeleton } from './insights-ui';
import { PayByRole } from './pay-by-role';
import { Scorecard } from './scorecard';
import { useDistribution, useGenderGap, useStats } from './queries';
import { useInsightsUrl } from './use-insights-url';

export function InsightsPage() {
  const { state, set, overview } = useInsightsUrl();
  const options = useFilterOptions();
  const { country } = state;
  const ready = country !== '';

  const summary = useStats(state, 'country', ready);
  const roles = useStats(state, 'jobTitle,level', ready);
  const gap = useGenderGap(state, ready);
  const dist = useDistribution(state, ready);

  const countryName = (code: string) =>
    options.data?.countries.find((c) => c.code === code)?.name ?? code;
  const clearFilters = () => set({ department: [], level: [] });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <InsightsFilters state={state} options={options.data} set={set} />
        <Scorecard total={summary.data?.[0]} country={country} />
      </div>

      {roles.isError ? (
        <Failed error={roles.error} retry={() => void roles.refetch()} />
      ) : roles.data?.length === 0 ? (
        <div className="space-y-3 py-6">
          <p className="text-lg font-semibold">No people match these filters</p>
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <AttentionSection state={state} ready={ready} />
          <Section title="Pay by role">
            <p className="text-muted-foreground">
              Every rail uses the same scale. Compa spread is the p75 minus the p25 of compa-ratio
              in the widest level; wider than 0.20 needs an explanation. Open a role to see its
              people.
            </p>
            {!ready || roles.isPending ? (
              <>
                <Skeleton rows={8} cols={5} />
                <p className="sr-only">Loading pay by role…</p>
              </>
            ) : (
              <PayByRole rows={roles.data ?? []} country={country} />
            )}
          </Section>
          <GenderGapSection gap={gap} country={country} />
          <DistributionSection
            dist={dist}
            country={country}
            countryName={countryName(country)}
            spread={summary.data?.[0]}
          />
        </>
      )}

      <CountriesSection
        overview={overview}
        countryName={countryName}
        selected={country}
        onSelect={(code) => set({ country: code })}
      />
    </div>
  );
}
