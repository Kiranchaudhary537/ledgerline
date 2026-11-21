import {
  DepartmentRepository,
  type Db,
  EmployeeRepository,
  InsightsRepository,
  SessionRepository,
  UserRepository,
} from '@acme/db';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyServerOptions, LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { errorHandler, sendError } from './errors.ts';
import { AuthService } from './modules/auth/service.ts';
import { authRoutes } from './modules/auth/routes.ts';
import { EmployeeService } from './modules/employees/service.ts';
import { employeeRoutes } from './modules/employees/routes.ts';
import { healthRoutes } from './modules/health/routes.ts';
import { HealthService } from './modules/health/service.ts';
import { insightsRoutes } from './modules/insights/routes.ts';
import { InsightsService } from './modules/insights/service.ts';
import { metaRoutes } from './modules/meta/routes.ts';
import { MetaService } from './modules/meta/service.ts';
import { authPlugin } from './plugins/auth.ts';

export interface AppOptions {
  db: Db;
  logger?: FastifyServerOptions['logger'];
  /** Send the session cookie over HTTPS only. True in production. */
  cookieSecure?: boolean;
  /** Trust X-Forwarded-* headers. True in production (behind proxies). */
  trustProxy?: boolean;
  /** Deployed git commit, reported by /api/health. */
  version?: string;
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
  version = 'dev',
}: AppOptions) {
  const app = Fastify({
    logger,
    genReqId: () => randomUUID(),
    // Behind Vercel → Render: use X-Forwarded-For so rate limits see the real client IP.
    trustProxy,
    // The onResponse hook below logs one line per request instead of Fastify's two.
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

  const auth = new AuthService(new UserRepository(db), new SessionRepository(db));
  const employees = new EmployeeService(new EmployeeRepository(db));
  const insights = new InsightsService(new InsightsRepository(db));
  const meta = new MetaService(new DepartmentRepository(db));
  const health = new HealthService(db, version);

  app.register(cookie);
  app.register(rateLimit, { global: false }); // limits are applied by authPlugin and the login route
  app.after(() => authPlugin(app, { auth }));
  // Registered after the plugins above load, so they apply to every route.
  app.register(async (routes) => {
    healthRoutes(routes, { health });
    authRoutes(routes, { auth, cookieSecure });
    employeeRoutes(routes, { employees });
    metaRoutes(routes, { meta });
    insightsRoutes(routes, { insights });
  });
  return app;
}
