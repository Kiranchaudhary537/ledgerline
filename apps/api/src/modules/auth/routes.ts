import {
  createSession,
  deleteSession,
  type Db,
  findUserByEmail,
  hashPassword,
  verifyPassword,
} from '@acme/db';
import { loginSchema } from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../errors.ts';

const SESSION_SECONDS = 8 * 60 * 60;

// Verified when the email is unknown, so both failures cost about the same time.
let dummyHash: Promise<string> | undefined;

export function authRoutes(
  app: FastifyInstance,
  { db, cookieSecure }: { db: Db; cookieSecure: boolean },
) {
  app.post(
    '/api/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
          keyGenerator: (request: { ip: string; body?: unknown }) => {
            const email = (request.body as { email?: unknown } | undefined)?.email;
            return `${request.ip}|${typeof email === 'string' ? email.trim().toLowerCase() : ''}`;
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = loginSchema.parse(request.body);
      const user = await findUserByEmail(db, email);
      dummyHash ??= hashPassword('dummy-password');
      const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
      if (!user || !ok) throw new AppError('INVALID_CREDENTIALS');
      const token = await createSession(db, user.id);
      reply.setCookie('session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: cookieSecure,
        path: '/',
        maxAge: SESSION_SECONDS,
      });
      return { user: { id: user.id, email: user.email, name: user.name } };
    },
  );

  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies.session;
    if (token) await deleteSession(db, token);
    return reply.clearCookie('session', { path: '/' }).status(204).send();
  });

  app.get('/api/auth/me', async (request) => ({ user: request.user }));
}
