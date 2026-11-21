import type { Db } from '../client.ts';

export function findUserByEmail(db: Db, email: string) {
  return db
    .selectFrom('users')
    .select(['id', 'email', 'name', 'passwordHash'])
    .where('email', '=', email)
    .executeTakeFirst();
}
