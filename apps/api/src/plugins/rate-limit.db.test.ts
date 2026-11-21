import { createTestDb, resetDb } from '@acme/db/testing';
import { config } from '@acme/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.ts';
import { loginCookie } from '../testing.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

describe('global rate limit', () => {
  it('counts anonymous requests that auth rejects, per IP', async () => {
    const app = buildApp({ db, logger: false });
    const hit = () => app.inject({ method: 'GET', url: '/api/employees' });
    for (let i = 0; i < config.rateLimit.apiMax; i++) expect((await hit()).statusCode).toBe(401);
    const res = await hit();
    expect(res.statusCode).toBe(429);
    expect(res.json().code).toBe('RATE_LIMITED');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    await app.close();
  });

  it('gives a logged-in user their own bucket', async () => {
    const app = buildApp({ db, logger: false });
    const cookie = await loginCookie(app, db);
    for (let i = 0; i < config.rateLimit.apiMax; i++) {
      await app.inject({ method: 'GET', url: '/api/employees' });
    }
    const anon = await app.inject({ method: 'GET', url: '/api/employees' });
    expect(anon.statusCode).toBe(429);
    const user = await app.inject({ method: 'GET', url: '/api/employees', headers: { cookie } });
    expect(user.statusCode).toBe(200);
    await app.close();
  });

  it('does not let a made-up session cookie escape the IP bucket', async () => {
    const app = buildApp({ db, logger: false });
    for (let i = 0; i < config.rateLimit.apiMax; i++) {
      await app.inject({
        method: 'GET',
        url: '/api/employees',
        headers: { cookie: `session=x${i}` },
      });
    }
    const res = await app.inject({
      method: 'GET',
      url: '/api/employees',
      headers: { cookie: 'session=fresh' },
    });
    expect(res.statusCode).toBe(429);
    await app.close();
  });
});
