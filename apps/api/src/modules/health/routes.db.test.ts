import { createDb } from '@acme/db';
import { createTestDb } from '@acme/db/testing';
import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.ts';

describe('GET /api/health', () => {
  const db = createTestDb();
  afterAll(() => db.destroy());

  it('is 200 when the database answers', async () => {
    const app = buildApp({ db, logger: false });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('is 503 when the database is down', async () => {
    const down = createDb('postgres://acme:acme@localhost:1/acme');
    const app = buildApp({ db: down, logger: false });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe('SERVICE_UNAVAILABLE');
    await app.close();
    await down.destroy();
  });
});
