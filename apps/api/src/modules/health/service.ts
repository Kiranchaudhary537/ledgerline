import { type Db, ping } from '@acme/db';

export class HealthService {
  readonly #db: Db;
  readonly #version: string;

  constructor(db: Db, version: string) {
    this.#db = db;
    this.#version = version;
  }

  /** Throws a connection error when the database is down (→ 503). */
  async check(): Promise<{ status: 'ok'; version: string }> {
    await ping(this.#db);
    return { status: 'ok', version: this.#version };
  }
}
