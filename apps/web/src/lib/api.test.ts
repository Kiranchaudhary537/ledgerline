import { ERRORS } from '@acme/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiError, api } from './api.ts';

function mockFetch(res: Response | Error) {
  const fn = vi.fn(() => (res instanceof Error ? Promise.reject(res) : Promise.resolve(res)));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  test('returns parsed JSON and sends JSON body with same-origin credentials', async () => {
    const fetchFn = mockFetch(Response.json({ ok: 1 }));
    await expect(api('/api/x', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/x');
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      body: '{"a":1}',
    });
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
  });

  test('204 resolves to undefined', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(api('/api/x')).resolves.toBeUndefined();
  });

  test('server error body becomes ApiError', async () => {
    mockFetch(
      Response.json(
        { code: 'VALIDATION_FAILED', message: 'Bad', fields: { email: 'Nope' }, requestId: 'r1' },
        { status: 400 },
      ),
    );
    const err = await api('/api/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      code: 'VALIDATION_FAILED',
      message: 'Bad',
      fields: { email: 'Nope' },
      status: 400,
      requestId: 'r1',
    });
  });

  test('network failure becomes SERVICE_UNAVAILABLE', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(api('/api/x')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: ERRORS.SERVICE_UNAVAILABLE.message,
    });
  });

  test('non-JSON error response becomes SERVICE_UNAVAILABLE', async () => {
    mockFetch(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(api('/api/x')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 502,
    });
  });
});
