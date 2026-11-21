import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors.ts';

type LimitOptions = {
  max: number;
  timeWindow: number;
  keyGenerator: (request: FastifyRequest) => string;
};

/**
 * Built on `createRateLimit`, not `app.rateLimit`: that handler runs once per request, so a
 * second limiter (login) on the same request would be skipped.
 */
export function rateLimiter(app: FastifyInstance, options: LimitOptions) {
  const check = app.createRateLimit(options);
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await check(request);
    if (result.isAllowed || !result.isExceeded) return;
    reply.header('Retry-After', result.ttlInSeconds);
    throw new AppError('RATE_LIMITED');
  };
}
