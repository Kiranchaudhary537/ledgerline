import { createDb } from '@acme/db';
import { employeeCreateSchema } from '@acme/shared';
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { AppError } from './errors.ts';

// Never queried in these tests; pg connects lazily.
const db = createDb('postgres://unused@localhost:1/unused');

async function appWithRoute(handler: () => unknown, logs?: string[]) {
  const logger = logs
    ? { level: 'info', stream: new Writable({ write: (c, _e, cb) => (logs.push(String(c)), cb()) }) }
    : false;
  const app = buildApp({ db, logger });
  app.post('/api/test', handler);
  await app.ready();
  return app;
}

let app: Awaited<ReturnType<typeof appWithRoute>>;
afterEach(() => app?.close());

describe('error handler', () => {
  it('maps AppError to its status and shared message, with a request id', async () => {
    app = await appWithRoute(() => {
      throw new AppError('STALE_VERSION');
    });
    const res = await app.inject({ method: 'POST', url: '/api/test' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      code: 'STALE_VERSION',
      message: 'Someone else changed this employee. Reload to see the latest.',
      requestId: expect.any(String),
    });
  });

  it('maps Zod errors to 400 with field messages', async () => {
    app = await appWithRoute(() => employeeCreateSchema.parse({}));
    const res = await app.inject({ method: 'POST', url: '/api/test' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      fields: { fullName: expect.any(String), salaryMinor: 'Enter a salary above 0' },
    });
  });

  it('maps a duplicate active email to EMAIL_TAKEN', async () => {
    app = await appWithRoute(() => {
      throw Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'employees_email_active',
      });
    });
    const res = await app.inject({ method: 'POST', url: '/api/test' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: 'EMAIL_TAKEN', fields: { email: 'Already in use' } });
  });

  it('maps a database connection failure to 503', async () => {
    app = await appWithRoute(() => {
      throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    });
    const res = await app.inject({ method: 'POST', url: '/api/test' });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe('SERVICE_UNAVAILABLE');
  });

  it('hides unexpected errors behind a generic 500', async () => {
    app = await appWithRoute(() => {
      throw new Error('boom: SELECT * FROM users');
    });
    const res = await app.inject({ method: 'POST', url: '/api/test' });
    expect(res.statusCode).toBe(500);
    expect(res.json().code).toBe('INTERNAL');
    expect(res.body).not.toContain('boom');
  });

  it('rejects malformed JSON as a validation error', async () => {
    app = await appWithRoute(() => 'ok');
    const res = await app.inject({
      method: 'POST',
      url: '/api/test',
      headers: { 'content-type': 'application/json' },
      payload: '{"fullName":',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_FAILED');
  });

  it('answers unknown routes with ROUTE_NOT_FOUND', async () => {
    app = await appWithRoute(() => 'ok');
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('ROUTE_NOT_FOUND');
  });

  it('asks crawlers not to index any response', async () => {
    app = await appWithRoute(() => 'ok');
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
  });

  it('never writes salary values or cookies to the logs', async () => {
    const logs: string[] = [];
    app = await appWithRoute(() => {
      throw new Error('boom');
    }, logs);
    await app.inject({
      method: 'POST',
      url: '/api/test',
      headers: { cookie: 'session=secret-token' },
      payload: { salaryMinor: 987654321 },
    });
    const output = logs.join('');
    expect(output).toContain('boom'); // the real error is logged for debugging…
    expect(output).not.toContain('987654321'); // …but never the body
    expect(output).not.toContain('secret-token');
  });
});
