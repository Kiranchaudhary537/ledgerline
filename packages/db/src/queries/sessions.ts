import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'kysely';
import type { Db } from '../client.ts';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Returns the cookie token. Only its SHA-256 is stored. */
export async function createSession(db: Db, userId: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await db
    .insertInto('sessions')
    .values({ id: hashToken(token), userId, expiresAt: sql<Date>`now() + interval '8 hours'` })
    .execute();
  return token;
}

export function findSessionUser(db: Db, token: string) {
  return db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.userId')
    .select(['users.id', 'users.email', 'users.name'])
    .where('sessions.id', '=', hashToken(token))
    .where('sessions.expiresAt', '>', sql<Date>`now()`)
    .executeTakeFirst();
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.deleteFrom('sessions').where('id', '=', hashToken(token)).execute();
}
