import { config } from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../errors.ts';
import type { AuthService } from '../modules/auth/service.ts';

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

export function authPlugin(app: FastifyInstance, { auth }: { auth: AuthService }) {
  app.addHook('onRequest', async (request) => {
    const url = request.routeOptions.url;
    // Unknown routes have no url: let them reach the 404 handler.
    if (!url || PUBLIC_ROUTES.has(url)) return;
    const token = request.cookies[config.cookie.sessionName];
    const user = token ? await auth.findSessionUser(token) : undefined;
    if (!user) throw new AppError('UNAUTHENTICATED');
    request.user = user;
  });
}
