import type { FastifyInstance } from 'fastify';
import type { MetaService } from './service.ts';

export function metaRoutes(app: FastifyInstance, { meta }: { meta: MetaService }) {
  app.get('/api/meta/filters', () => meta.filterOptions());
}
