import { type Db, hashPassword, SessionRepository } from '@acme/db';
import { config } from '@acme/shared';
import type { buildApp } from './app.ts';

const PASSWORD = 'correct-horse-battery';
let defaultHash: Promise<string> | undefined; // scrypt is slow: hash the shared password once

export interface TestUser {
  id: number;
  email: string;
  name: string;
  password: string;
}

export async function createTestUser(
  db: Db,
  overrides: Partial<Omit<TestUser, 'id'>> = {},
): Promise<TestUser> {
  const { email = 'hr@acme.example', name = 'Hana HR', password = PASSWORD } = overrides;
  const passwordHash =
    password === PASSWORD
      ? await (defaultHash ??= hashPassword(PASSWORD))
      : await hashPassword(password);
  const { id } = await db
    .insertInto('users')
    .values({ email, name, passwordHash })
    .returning('id')
    .executeTakeFirstOrThrow();
  return { id, email, name, password };
}

export async function loginCookie(_app: ReturnType<typeof buildApp>, db: Db): Promise<string> {
  const user = await createTestUser(db);
  return `${config.cookie.sessionName}=${await new SessionRepository(db).create(user.id)}`;
}
