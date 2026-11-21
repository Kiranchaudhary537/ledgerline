import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { SessionRepository } from './session-repository.ts';
import { createTestDb, resetDb } from '../testing.ts';

const db = createTestDb();
const sessions = new SessionRepository(db);
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const addUser = () =>
  db
    .insertInto('users')
    .values({ email: 'hr@acme.example', name: 'Hana HR', passwordHash: 'x' })
    .returning('id')
    .executeTakeFirstOrThrow();

describe('sessions', () => {
  it('stores only the hash of the token', async () => {
    const { id } = await addUser();
    const token = await sessions.create(id);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    const rows = await db.selectFrom('sessions').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0]!.id).not.toBe(token);
  });

  it('finds the user for a live session and expires after 8 hours', async () => {
    const { id } = await addUser();
    const token = await sessions.create(id);
    expect(await sessions.findUser(token)).toEqual({
      id,
      email: 'hr@acme.example',
      name: 'Hana HR',
    });
    const row = await db.selectFrom('sessions').select('expiresAt').executeTakeFirstOrThrow();
    const hours = (new Date(row.expiresAt).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(7.9);
    expect(hours).toBeLessThanOrEqual(8);
    await db
      .updateTable('sessions')
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .execute();
    expect(await sessions.findUser(token)).toBeUndefined();
  });

  it('deletes a session', async () => {
    const { id } = await addUser();
    const token = await sessions.create(id);
    await sessions.delete(token);
    expect(await sessions.findUser(token)).toBeUndefined();
  });
});
