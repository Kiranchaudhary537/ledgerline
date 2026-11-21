import { sql } from 'kysely';
import { describe, expect, it, vi } from 'vitest';
import { createDb, ping } from './client.ts';
import { TEST_DATABASE_URL } from './testing.ts';

describe('createDb', () => {
  it('survives Postgres closing an idle connection and reconnects', async () => {
    const onPoolError = vi.fn();
    const db = createDb(TEST_DATABASE_URL, { onPoolError });
    const { pid } = (await sql<{ pid: number }>`SELECT pg_backend_pid() AS pid`.execute(db)).rows[0]!;

    // What `docker compose stop` or a managed-DB failover does to idle pooled connections.
    const admin = createDb(TEST_DATABASE_URL);
    await sql`SELECT pg_terminate_backend(${pid})`.execute(admin);
    await admin.destroy();
    await vi.waitFor(() => expect(onPoolError).toHaveBeenCalled());

    await expect(ping(db)).resolves.toBeUndefined();
    await db.destroy();
  });
});
