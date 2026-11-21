import { config } from '@acme/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError } from '../errors.ts';
import type { AuthService } from '../modules/auth/service.ts';
import { rateLimiter } from './rate-limit.ts';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

/** Everything else needs a session. Add a route here only if it must work logged out. */
export const PUBLIC_ROUTES = new Set(['/api/auth/login', '/api/health']);

/**
 * One hook so the order is explicit: identify the session, count the request, then reject
 * anonymous callers. Counting before rejecting is what rate-limits unauthenticated traffic.
 * Call after the cookie and rate-limit plugins have loaded.
 */
export function authPlugin(app: FastifyInstance, { auth }: { auth: AuthService }) {
  const limit = rateLimiter(app, {
    max: config.rateLimit.apiMax,
    timeWindow: config.rateLimit.windowMs,
    // A cookie that is not a live session falls back to the IP, so forged cookies cannot dodge it.
    keyGenerator: (request) => (request.user ? `user:${request.user.id}` : request.ip),
  });
  app.addHook('onRequest', async (request, reply) => {
    const url = request.routeOptions.url;
    // Unknown routes have no url: let them reach the 404 handler.
    const isPublic = !url || PUBLIC_ROUTES.has(url);
    const token = request.cookies[config.cookie.sessionName];
    request.user = token && !isPublic ? await auth.findSessionUser(token) : undefined;
    await limit(request, reply);
    if (!isPublic && !request.user) throw new AppError('UNAUTHENTICATED');
  });
}

export function requireUser(request: FastifyRequest): SessionUser {
  if (!request.user) throw new AppError('UNAUTHENTICATED');
  return request.user;
}
