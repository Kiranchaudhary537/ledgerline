import { config } from '@acme/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, QueryBoundary, RowsSkeleton } from '@/components/ui/states';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { useDistribution, useGenderGap, useStats } from './api/queries';
import { CountriesTable } from './components/CountriesTable';
import { DistributionChart } from './components/DistributionChart';
import { GenderGapChart } from './components/GenderGapChart';
import { InsightCard } from './components/InsightCard';
import { PayByRoleTable } from './components/PayByRoleTable';
import { PayQuestion } from './components/PayQuestion';
import { useInsightsUrl } from './hooks/use-insights-url';

/** Leads with one question and its answer; the sections below follow the same country (and role and level where they can). */
export function InsightsPage() {
  const { state, set, overview } = useInsightsUrl();
  const options = useFilterOptions();
  const { country } = state;
  const ready = country !== '';

  const answer = useStats(state, 'country', ready);
  const roles = useStats(state, 'jobTitle,level', ready, ['jobTitle', 'level']);
  const gap = useGenderGap(state, ready);
  const dist = useDistribution(state, ready);

  const countryName = (code: string) =>
    options.data?.countries.find((c) => c.code === code)?.name ?? code;

  return (
    <div className="space-y-6">
      <PayQuestion
        state={state}
        options={options.data}
        set={set}
        answer={{
          data: answer.data,
          isPending: answer.isPending,
          error: answer.error,
          refetch: () => void answer.refetch(),
        }}
      />

      <InsightCard
        title="Pay by level per role"
        description={`Median pay at each level, on one scale for every role in ${countryName(country)}. Open a role to see each level's pay band.`}
      >
        <QueryBoundary
          error={roles.error}
          onRetry={() => void roles.refetch()}
          ready={ready && !!roles.data}
          skeleton={<RowsSkeleton rows={8} cols={4} />}
        >
          {roles.data?.length === 0 ? (
            <EmptyState
              title="No one is paid in this country yet"
              description="Roles and their levels appear here once employees are added."
            />
          ) : (
            <PayByRoleTable rows={roles.data ?? []} country={country} />
          )}
        </QueryBoundary>
      </InsightCard>

      <InsightCard
        title="Salary distribution"
        description="How many people earn in each range, for the role and level above. The shaded band is the middle half; the line is the median."
      >
        <QueryBoundary
          error={dist.error}
          onRetry={() => void dist.refetch()}
          ready={!!dist.data}
          skeleton={<Skeleton aria-hidden className="mx-5 mb-5 h-52" />}
        >
          {dist.data && dist.data.buckets.length > 0 ? (
            <DistributionChart
              data={dist.data}
              countryCode={country}
              name={`Salaries in ${countryName(country)}`}
              spread={answer.data?.[0]}
            />
          ) : (
            <EmptyState
              title="No salaries to chart"
              description="The distribution appears once someone matches the role and level above."
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
          <GenderGapChart rows={gap.data ?? []} country={country} />
        </QueryBoundary>
      </InsightCard>

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
