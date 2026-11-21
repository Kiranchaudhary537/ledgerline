import type { ZodError } from 'zod';

/** Every error the API can return. Messages are shown to the HR manager as-is. */
export const ERRORS = {
  VALIDATION_FAILED: { status: 400, message: 'Please fix the highlighted fields.' },
  UNAUTHENTICATED: { status: 401, message: 'Please log in to continue.' },
  INVALID_CREDENTIALS: { status: 401, message: 'Email or password is incorrect.' },
  NOT_FOUND: { status: 404, message: 'This employee no longer exists.' },
  EMAIL_TAKEN: { status: 409, message: 'This email is already used by another employee.' },
  STALE_VERSION: {
    status: 409,
    message: 'Someone else changed this employee. Reload to see the latest.',
  },
  RATE_LIMITED: { status: 429, message: 'Too many attempts. Try again in a minute.' },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: 'The service is unavailable right now. Try again shortly.',
  },
  INTERNAL: { status: 500, message: 'Something went wrong. Please try again.' },
} as const satisfies Record<string, { status: number; message: string }>;

export type ErrorCode = keyof typeof ERRORS;

/** The JSON body of every non-2xx API response. */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  /** Form errors only: field name → short message. */
  fields?: Record<string, string>;
  requestId?: string;
}

/** Turns a Zod error into `fields`: first message per top-level field. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    fields[key] ??= issue.message;
  }
  return fields;
}
