import { config, loginSchema } from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import { rateLimiter } from '../../plugins/rate-limit.ts';
import type { AuthService } from './service.ts';

export function authRoutes(
  app: FastifyInstance,
  { auth, cookieSecure }: { auth: AuthService; cookieSecure: boolean },
) {
  app.post(
    '/api/auth/login',
    {
      // preHandler, not onRequest: the key needs the parsed body.
      preHandler: rateLimiter(app, {
        max: config.rateLimit.loginMax,
        timeWindow: config.rateLimit.windowMs,
        keyGenerator: (request) => {
          const login = loginSchema.safeParse(request.body);
          return `${request.ip}|${login.success ? login.data.email.toLowerCase() : ''}`;
        },
      }),
    },
    async (request, reply) => {
      const { email, password } = loginSchema.parse(request.body);
      const { token, user } = await auth.login(email, password);
      reply.setCookie(config.cookie.sessionName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: cookieSecure,
        path: '/',
        maxAge: config.session.ttlSeconds,
      });
      return { user };
    },
  );

  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies[config.cookie.sessionName];
    if (token) await auth.logout(token);
    return reply.clearCookie(config.cookie.sessionName, { path: '/' }).status(204).send();
  });

  app.get('/api/auth/me', async (request) => ({ user: request.user }));
}
