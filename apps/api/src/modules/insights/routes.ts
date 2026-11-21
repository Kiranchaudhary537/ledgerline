import { type Db, getDistribution, getGenderGap, getStats } from '@acme/db';
import {
  type CountryCode,
  type Distribution,
  distributionQuerySchema,
  type GenderGapRow,
  genderGapQuerySchema,
  getCountry,
  statsQuerySchema,
  type StatsRow,
} from '@acme/shared';
import type { FastifyInstance } from 'fastify';

export function insightsRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/api/insights/stats', async (request): Promise<StatsRow[]> =>
    getStats(db, statsQuerySchema.parse(request.query)),
  );

  app.get('/api/insights/gender-gap', async (request): Promise<GenderGapRow[]> =>
    getGenderGap(db, genderGapQuerySchema.parse(request.query)),
  );

  app.get('/api/insights/distribution', async (request): Promise<Distribution> => {
    const q = distributionQuerySchema.parse(request.query);
    const { currency, buckets } = await getDistribution(db, q);
    // Empty set: the schema guarantees exactly one country, so use its currency.
    return { currency: currency ?? getCountry(q.country![0] as CountryCode).currency, buckets };
  });
}
