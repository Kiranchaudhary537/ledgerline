import { type Db, ping } from '@acme/db';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/api/health', async () => {
    await ping(db); // throws a connection error → 503 via the error handler
    return { status: 'ok' };
  });
}
