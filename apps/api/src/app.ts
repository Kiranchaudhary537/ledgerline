import type { Db } from '@acme/db';
import Fastify, { type FastifyServerOptions, LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { errorHandler, sendError } from './errors.ts';
import { healthRoutes } from './modules/health/routes.ts';

export interface AppOptions {
  db: Db;
  logger?: FastifyServerOptions['logger'];
}

export function buildApp({ db, logger = true }: AppOptions) {
  const app = Fastify({
    logger,
    genReqId: () => randomUUID(),
    // Replaced by the single line below.
    logController: new LogController({ disableRequestLogging: true }),
  });

  // One line per request. Never bodies or headers (salaries, cookies).
  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        status: reply.statusCode,
        ms: Math.round(reply.elapsedTime),
      },
      'request',
    );
  });
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Robots-Tag', 'noindex, nofollow');
  });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((request, reply) => sendError(reply, request, 'ROUTE_NOT_FOUND'));

  healthRoutes(app, { db });
  return app;
}
