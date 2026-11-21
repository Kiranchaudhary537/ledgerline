import { Button } from '@/components/ui/button';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { CountriesSection } from '@/features/insights/components/CountriesSection';
import { DistributionSection } from '@/features/insights/components/DistributionSection';
import { GenderGapSection } from '@/features/insights/components/GenderGapSection';
import { AttentionSection } from '@/features/insights/components/AttentionSection';
import { InsightsFilters } from '@/features/insights/components/InsightsFilters';
import { Failed, Section, Skeleton } from '@/features/insights/components/Section';
import { PayByRole } from '@/features/insights/components/PayByRole';
import { Scorecard } from '@/features/insights/components/Scorecard';
import { useDistribution, useGenderGap, useStats } from '@/features/insights/api/queries';
import { useInsightsUrl } from '@/features/insights/hooks/use-insights-url';

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
