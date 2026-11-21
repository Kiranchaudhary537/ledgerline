import type { InsightsRepository } from '@acme/db';
import {
  type Distribution,
  type DistributionQuery,
  type GenderGapQuery,
  type GenderGapRow,
  getCountry,
  type StatsQuery,
  type StatsRow,
} from '@acme/shared';

export type InsightsStore = Pick<InsightsRepository, 'stats' | 'genderGap' | 'distribution'>;

export class InsightsService {
  private readonly insights: InsightsStore;

  constructor(insights: InsightsStore) {
    this.insights = insights;
  }

  stats(query: StatsQuery): Promise<StatsRow[]> {
    return this.insights.stats(query);
  }

  genderGap(query: GenderGapQuery): Promise<GenderGapRow[]> {
    return this.insights.genderGap(query);
  }

  async distribution(query: DistributionQuery): Promise<Distribution> {
    const { currency, buckets } = await this.insights.distribution(query);
    // Empty set: the schema guarantees exactly one country, so use its currency.
    // `!`: hasOneCountry in the query schema rejects a missing country.
    return { currency: currency ?? getCountry(query.country![0]!).currency, buckets };
  }
}
