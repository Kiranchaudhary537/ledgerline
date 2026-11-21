import type { Db } from '@acme/db';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { config } from '@acme/shared';
import Fastify, { type FastifyServerOptions, LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { errorHandler, sendError } from './errors.ts';
import { authRoutes } from './modules/auth/routes.ts';
import { employeeRoutes } from './modules/employees/routes.ts';
import { healthRoutes } from './modules/health/routes.ts';
import { metaRoutes } from './modules/meta/routes.ts';
import { insightsRoutes } from './modules/insights/routes.ts';
import { authPlugin } from './plugins/auth.ts';

export interface AppOptions {
  db: Db;
  logger?: FastifyServerOptions['logger'];
  /** Send the session cookie over HTTPS only. True in production. */
  cookieSecure?: boolean;
  /** Trust X-Forwarded-* headers. True in production (behind proxies). */
  trustProxy?: boolean;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Every route registered so far, so tests can check them all. */
    registeredRoutes: { method: string; url: string }[];
  }
}

export function buildApp({
  db,
  logger = true,
  cookieSecure = false,
  trustProxy = false,
}: AppOptions) {
  const app = Fastify({
    logger,
    genReqId: () => randomUUID(),
    // Behind Vercel → Render: use X-Forwarded-For so rate limits see the real client IP.
    trustProxy,
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

  app.decorate('registeredRoutes', []);
  app.addHook('onRoute', (route) => {
    for (const method of [route.method].flat()) {
      app.registeredRoutes.push({ method, url: route.url });
    }
  });

  app.register(cookie);
  // Default 300/min per user (IP before login); the login route sets its own limit.
  app.register(rateLimit, {
    max: config.rateLimit.apiMax,
    timeWindow: config.rateLimit.windowMs,
    hook: 'preHandler', // after onRequest auth and body parsing, so keys can use both
    keyGenerator: (request) => String(request.user?.id ?? request.ip),
  });
  authPlugin(app, { db });
  // Registered after the plugins above load, so they apply to every route.
  app.register(async (routes) => {
    healthRoutes(routes, { db });
    authRoutes(routes, { db, cookieSecure });
    employeeRoutes(routes, { db });
    metaRoutes(routes, { db });
    insightsRoutes(routes, { db });
  });
  return app;
}
