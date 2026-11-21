import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.ts';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(await verifyPassword('correct horse battery stapl', stored)).toBe(false);
  });

  it('never stores the password and salts every hash', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toContain('same-password');
    expect(a).not.toBe(b);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});
