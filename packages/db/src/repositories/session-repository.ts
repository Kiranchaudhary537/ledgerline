import { config } from '@acme/shared';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'kysely';
import type { Db } from '../client.ts';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export class SessionRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /** Returns the cookie token. Only its SHA-256 is stored, so a DB leak cannot be replayed. */
  async create(userId: number): Promise<string> {
    const token = randomBytes(config.session.tokenBytes).toString('base64url');
    await this.db
      .insertInto('sessions')
      .values({
        id: hashToken(token),
        userId,
        expiresAt: sql<Date>`now() + make_interval(secs => ${config.session.ttlSeconds})`,
      })
      .execute();
    return token;
  }

  findUser(token: string) {
    return this.db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.userId')
      .select(['users.id', 'users.email', 'users.name'])
      .where('sessions.id', '=', hashToken(token))
      .where('sessions.expiresAt', '>', sql<Date>`now()`)
      .executeTakeFirst();
  }

  async delete(token: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id', '=', hashToken(token)).execute();
  }
}
