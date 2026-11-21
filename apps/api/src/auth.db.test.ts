import { createTestDb, resetDb } from '@acme/db/testing';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { createTestUser } from './testing.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const login = (app: ReturnType<typeof buildApp>, email: string, password: string) =>
  app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });

const cookieOf = (res: { cookies: { name: string; value: string }[] }) =>
  `session=${res.cookies.find((c) => c.name === 'session')?.value}`;

describe('auth', () => {
  it('login sets an httpOnly cookie and /me returns the user', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    const res = await login(app, user.email, user.password);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ user: { id: user.id, email: user.email, name: user.name } });
    const cookie = res.cookies.find((c) => c.name === 'session')!;
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 28800 });
    expect(cookie.secure).toBeFalsy();
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieOf(res) },
    });
    expect(me.json()).toEqual({ user: { id: user.id, email: user.email, name: user.name } });
    await app.close();
  });

  it('marks the cookie secure when asked', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false, cookieSecure: true });
    const res = await login(app, user.email, user.password);
    expect(res.cookies.find((c) => c.name === 'session')?.secure).toBe(true);
    await app.close();
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    const wrong = await login(app, user.email, 'nope');
    const unknown = await login(app, 'nobody@acme.example', 'nope');
    expect(wrong.statusCode).toBe(401);
    expect(wrong.json().code).toBe('INVALID_CREDENTIALS');
    expect(unknown.statusCode).toBe(401);
    const { requestId: _a, ...a } = wrong.json();
    const { requestId: _b, ...b } = unknown.json();
    expect(a).toEqual(b);
    await app.close();
  });

  it('stores a hash, not the cookie token', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    const res = await login(app, user.email, user.password);
    const token = cookieOf(res).slice('session='.length);
    const ids = (await db.selectFrom('sessions').select('id').execute()).map((r) => r.id);
    expect(ids).toHaveLength(1);
    expect(ids).not.toContain(token);
    await app.close();
  });

  it('rejects an expired session', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    const res = await login(app, user.email, user.password);
    await db.updateTable('sessions').set({ expiresAt: new Date(Date.now() - 1000) }).execute();
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieOf(res) },
    });
    expect(me.statusCode).toBe(401);
    expect(me.json().code).toBe('UNAUTHENTICATED');
    await app.close();
  });

  it('logout invalidates the session and clears the cookie', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    const cookie = cookieOf(await login(app, user.email, user.password));
    const out = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    });
    expect(out.statusCode).toBe(204);
    expect(out.cookies.find((c) => c.name === 'session')?.value).toBe('');
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
    await app.close();
  });

  it('rate-limits the 6th login attempt in a minute', async () => {
    const user = await createTestUser(db);
    const app = buildApp({ db, logger: false });
    for (let i = 0; i < 5; i++) {
      expect((await login(app, user.email, 'nope')).statusCode).toBe(401);
    }
    const res = await login(app, user.email.toUpperCase(), 'nope');
    expect(res.statusCode).toBe(429);
    expect(res.json().code).toBe('RATE_LIMITED');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    // another email from the same IP is not blocked
    expect((await login(app, 'other@acme.example', 'nope')).statusCode).toBe(401);
    await app.close();
  });

  it('every non-public route is 401 without a session; health stays public', async () => {
    const app = buildApp({ db, logger: false });
    await app.ready();
    const health = await app.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);
    const protectedRoutes = app.registeredRoutes.filter(
      (r) => !['/api/auth/login', '/api/health'].includes(r.url),
    );
    expect(protectedRoutes.length).toBeGreaterThanOrEqual(2); // at least logout and me
    for (const { method, url } of protectedRoutes) {
      const res = await app.inject({ method, url: url.replace(/:\w+/g, '1') });
      expect([method, url, res.statusCode]).toEqual([method, url, 401]);
    }
    const unknown = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(unknown.statusCode).toBe(404);
    await app.close();
  });
});
