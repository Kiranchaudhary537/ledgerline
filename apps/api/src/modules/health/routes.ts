import type { FastifyInstance } from 'fastify';
import type { HealthService } from './service.ts';

export function healthRoutes(app: FastifyInstance, { health }: { health: HealthService }) {
  app.get('/api/health', () => health.check());
}
