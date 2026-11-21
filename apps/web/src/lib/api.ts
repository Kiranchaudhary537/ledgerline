import { ERRORS, type ApiErrorBody, type ErrorCode } from '@acme/shared';

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    extra: { fields?: Record<string, string>; requestId?: string } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    if (extra.fields) this.fields = extra.fields;
    if (extra.requestId) this.requestId = extra.requestId;
  }
}

const unavailable = (status = 0) =>
  new ApiError('SERVICE_UNAVAILABLE', ERRORS.SERVICE_UNAVAILABLE.message, status);

/** JSON in, JSON out. 204 → undefined. Any failure throws ApiError. */
export async function api<T = undefined>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? 'GET',
      credentials: 'same-origin',
      ...(opts.body !== undefined && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts.body),
      }),
    });
  } catch {
    throw unavailable();
  }

  if (res.status === 204) return undefined as T;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw unavailable(res.status);
  }

  if (!res.ok) {
    const body = data as Partial<ApiErrorBody> | null;
    if (!body?.code || !(body.code in ERRORS)) throw unavailable(res.status);
    throw new ApiError(body.code, body.message ?? ERRORS[body.code].message, res.status, {
      ...(body.fields && { fields: body.fields }),
      ...(body.requestId && { requestId: body.requestId }),
    });
  }
  return data as T;
}
