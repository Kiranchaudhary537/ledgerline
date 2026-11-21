import { type Db, ping } from '@acme/db';

export class HealthService {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  /** Throws a connection error when the database is down (→ 503). */
  async check(): Promise<{ status: 'ok' }> {
    await ping(this.#db);
    return { status: 'ok' };
  }
}
