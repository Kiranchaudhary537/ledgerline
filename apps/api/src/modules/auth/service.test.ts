import { hashPassword } from '@acme/db';
import { beforeAll, describe, expect, it } from 'vitest';
import { AppError } from '../../errors.ts';
import { AuthService, type SessionStore, type UserStore } from './service.ts';

let passwordHash: string;
beforeAll(async () => {
  passwordHash = await hashPassword('correct-horse-battery');
});

function build() {
  const created: number[] = [];
  const users: UserStore = {
    findByEmail: async (email) =>
      email === 'hr@acme.example' ? { id: 3, email, name: 'Hana HR', passwordHash } : undefined,
  };
  const sessions: SessionStore = {
    create: async (userId) => {
      created.push(userId);
      return 'token-1';
    },
    findUser: async () => undefined,
    delete: async () => {},
  };
  return { service: new AuthService(users, sessions), created };
}

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (e: unknown) => e,
  );

// Real-strength scrypt (OWASP params, ~128 MB per hash) is slow when all test files run in parallel.
describe('AuthService.login', { timeout: 30_000 }, () => {
  it('returns the user and a session token for correct credentials', async () => {
    const { service, created } = build();
    expect(await service.login('hr@acme.example', 'correct-horse-battery')).toEqual({
      token: 'token-1',
      user: { id: 3, email: 'hr@acme.example', name: 'Hana HR' },
    });
    expect(created).toEqual([3]);
  });

  it('fails the same way for an unknown email and a wrong password, creating no session', async () => {
    const { service, created } = build();
    const unknown = await failure(service.login('nobody@acme.example', 'whatever'));
    const wrong = await failure(service.login('hr@acme.example', 'wrong-password'));
    expect(unknown).toBeInstanceOf(AppError);
    expect(wrong).toBeInstanceOf(AppError);
    expect((unknown as AppError).code).toBe('INVALID_CREDENTIALS');
    expect((wrong as AppError).code).toBe('INVALID_CREDENTIALS');
    expect(created).toEqual([]);
  });
});
