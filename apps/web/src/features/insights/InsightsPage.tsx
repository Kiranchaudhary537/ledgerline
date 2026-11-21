import { Card } from '@/components/ui/card';
import { EmptyState, Failed, QueryBoundary, RowsSkeleton } from '@/components/ui/states';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { useDistribution, useGenderGap, useStats } from './api/queries';
import { CountriesTable } from './components/CountriesTable';
import { DistributionChart } from './components/DistributionChart';
import { GenderGapPlot } from './components/GenderGapPlot';
import { InsightCard } from './components/InsightCard';
import { InsightsToolbar } from './components/InsightsToolbar';
import { PayByRoleTable } from './components/PayByRoleTable';
import { SummaryCard } from './components/SummaryCard';
import { useInsightsUrl } from './hooks/use-insights-url';
import { config } from '@acme/shared';

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
  const total = summary.data?.[0];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Insights</h1>
      <InsightsToolbar state={state} options={options.data} set={set} />
      <SummaryCard total={total} country={country} countryName={countryName(country)} />

      {roles.isError ? (
        <Card>
          <Failed error={roles.error} retry={() => void roles.refetch()} />
        </Card>
      ) : roles.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No people match these filters"
            action={{ label: 'Clear filters', onClick: () => set({ department: [], level: [] }) }}
          />
        </Card>
      ) : (
        <>
          <InsightCard
            title="Pay by role"
            description="Every ladder uses the same scale. Open a role to see its levels."
          >
            {ready && roles.data ? (
              <PayByRoleTable rows={roles.data} country={country} />
            ) : (
              <RowsSkeleton rows={8} cols={4} />
            )}
          </InsightCard>
          <InsightCard
            title="Salary distribution"
            description="The shaded band is the middle half of salaries (p25 to p75); the line is the median."
          >
            <QueryBoundary
              error={dist.error}
              onRetry={() => void dist.refetch()}
              ready={!!dist.data && dist.data.buckets.length > 0}
              skeleton={
                <div
                  aria-hidden
                  className="mx-5 mb-5 h-44 rounded-md bg-muted motion-safe:animate-pulse"
                />
              }
            >
              {dist.data && (
                <DistributionChart
                  data={dist.data}
                  country={country}
                  countryName={countryName(country)}
                  spread={total}
                />
              )}
            </QueryBoundary>
          </InsightCard>
          <InsightCard
            title="Gender gap by role"
            description={`The gap is the men’s median minus the women’s, as a share of the men’s. Roles with fewer than ${config.insights.genderGapMinGroupSize} women or men are not plotted.`}
          >
            <QueryBoundary
              error={gap.error}
              onRetry={() => void gap.refetch()}
              ready={!!gap.data}
              skeleton={<RowsSkeleton rows={5} cols={3} />}
            >
              <GenderGapPlot rows={gap.data ?? []} country={country} />
            </QueryBoundary>
          </InsightCard>
        </>
      )}

      <InsightCard title="Countries" description="Pick a country to switch the page to it.">
        <QueryBoundary
          error={overview.error}
          onRetry={() => void overview.refetch()}
          ready={!!overview.data}
          skeleton={<RowsSkeleton rows={5} cols={4} />}
        >
          <CountriesTable
            rows={overview.data ?? []}
            countryName={countryName}
            selected={country}
            onSelect={(code) => set({ country: code })}
          />
        </QueryBoundary>
      </InsightCard>
    </div>
  );
}
