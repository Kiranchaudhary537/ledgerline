import { distributionQuerySchema, genderGapQuerySchema, statsQuerySchema } from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import type { InsightsService } from './service.ts';

export function insightsRoutes(app: FastifyInstance, { insights }: { insights: InsightsService }) {
  app.get('/api/insights/stats', (request) =>
    insights.stats(statsQuerySchema.parse(request.query)),
  );
  app.get('/api/insights/gender-gap', (request) =>
    insights.genderGap(genderGapQuerySchema.parse(request.query)),
  );
  app.get('/api/insights/distribution', (request) =>
    insights.distribution(distributionQuerySchema.parse(request.query)),
  );
}
