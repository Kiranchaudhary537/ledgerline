import { type ApiErrorBody, ERRORS, type ErrorCode, fieldErrors } from '@acme/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

/** Throw this from services: `throw new AppError('STALE_VERSION')`. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields: Record<string, string> | undefined;

  constructor(code: ErrorCode, fields?: Record<string, string>) {
    super(code);
    this.code = code;
    this.fields = fields;
  }
}

// Node network errors and Postgres "connection" / "server shutting down" SQLSTATEs.
const CONNECTION_ERRORS = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  '57P01',
  '57P03',
  '08000',
  '08001',
  '08003',
  '08006',
]);

type ErrorLike = Partial<FastifyError> & { constraint?: string };

function classify(err: ErrorLike): { code: ErrorCode; fields?: Record<string, string> } {
  if (err instanceof AppError) return { code: err.code, ...(err.fields && { fields: err.fields }) };
  if (err instanceof ZodError) return { code: 'VALIDATION_FAILED', fields: fieldErrors(err) };
  if (err.code === '23505' && err.constraint === 'employees_email_active') {
    return { code: 'EMAIL_TAKEN', fields: { email: 'Already in use' } };
  }
  if (err.code === '23503' && err.constraint === 'employees_department_job_title_fkey') {
    return {
      code: 'VALIDATION_FAILED',
      fields: { jobTitle: 'Choose a job title in this department' },
    };
  }
  if (err.code === '23503' && err.constraint === 'employees_country_code_fkey') {
    return { code: 'VALIDATION_FAILED', fields: { countryCode: 'Choose a country' } };
  }
  if (err.code && CONNECTION_ERRORS.has(err.code)) return { code: 'SERVICE_UNAVAILABLE' };
  if (err.statusCode === 429) return { code: 'RATE_LIMITED' };
  // Fastify's own client errors: malformed JSON, body too large, wrong content type…
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return { code: 'VALIDATION_FAILED' };
  }
  return { code: 'INTERNAL' };
}

export function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  code: ErrorCode,
  fields?: Record<string, string>,
) {
  const { status, message } = ERRORS[code];
  const body: ApiErrorBody = { code, message, ...(fields && { fields }), requestId: request.id };
  return reply.status(status).send(body);
}

export function errorHandler(err: ErrorLike, request: FastifyRequest, reply: FastifyReply) {
  const { code, fields } = classify(err);
  if (ERRORS[code].status >= 500) {
    // Only these fields: Postgres `detail` can contain row values (salaries).
    request.log.error(
      { err: { type: err.name, message: err.message, code: err.code, stack: err.stack } },
      'request failed',
    );
  }
  return sendError(reply, request, code, fields);
}
