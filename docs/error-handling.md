# Error handling

One error shape, defined once in `packages/shared/src/errors.ts`, used by API and UI.

## Shape

```json
{ "code": "EMAIL_TAKEN", "message": "This email is already used by another employee.", "fields": { "email": "Already in use" }, "requestId": "a1b2c3" }
```

- `code` – stable, for code to check.
- `message` – plain sentence a HR manager understands. No stack traces, no SQL, no salary values.
- `fields` – only for form errors: field → short message.
- `requestId` – also in the server log, to find the cause.

## Codes

| Code | HTTP | Message shown |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Please fix the highlighted fields. |
| `UNAUTHENTICATED` | 401 | Please log in to continue. |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect. |
| `NOT_FOUND` | 404 | This employee no longer exists. |
| `ROUTE_NOT_FOUND` | 404 | This page does not exist. |
| `EMAIL_TAKEN` | 409 | This email is already used by another employee. |
| `STALE_VERSION` | 409 | Someone else changed this employee. Reload to see the latest. |
| `RATE_LIMITED` | 429 | Too many attempts. Try again in a minute. |
| `SERVICE_UNAVAILABLE` | 503 | The service is unavailable right now. Try again shortly. |
| `INTERNAL` | 500 | Something went wrong. Please try again. |

## API side

- Services throw `new AppError('STALE_VERSION')`; status and message come from the table.
- One Fastify error handler turns everything into the shape:
  - Zod error → `VALIDATION_FAILED` + `fields`
  - Postgres unique violation → `EMAIL_TAKEN`
  - DB connection error → `SERVICE_UNAVAILABLE`
  - Malformed JSON body → `VALIDATION_FAILED`; unknown URL → `ROUTE_NOT_FOUND`
  - anything else → `INTERNAL` (full error logged with `requestId`, never sent)

## UI side

- `lib/api.ts` throws `ApiError {code, message, fields}` for any non-2xx.
- Forms: `fields` → inline errors under each input.
- `UNAUTHENTICATED` → go to login, come back after.
- `STALE_VERSION` → banner with a "Reload" button.
- Everything else → toast with `message`.
- Network down (no response) → same message as `SERVICE_UNAVAILABLE`.
