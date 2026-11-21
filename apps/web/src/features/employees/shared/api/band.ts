import type { Employee } from '@acme/shared';
import { useStatsQuery } from '@/lib/stats-query';

/** Pay band of the employee's country × title × level × employment type. */
export function useBand(e: Employee | undefined) {
  const params = new URLSearchParams(
    e
      ? {
          country: e.countryCode,
          jobTitle: e.jobTitle,
          level: e.level,
          employmentType: e.employmentType,
          groupBy: 'level',
        }
      : {},
  );
  const stats = useStatsQuery(params, !!e);
  return { ...stats, data: stats.data?.[0] };
}
