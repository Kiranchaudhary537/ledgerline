import type { Db } from '../client.ts';

export class UserRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  findByEmail(email: string) {
    return this.db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'passwordHash'])
      .where('email', '=', email)
      .executeTakeFirst();
  }
}
