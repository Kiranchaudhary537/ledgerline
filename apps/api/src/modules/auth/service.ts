import {
  hashPassword,
  type SessionRepository,
  type UserRepository,
  verifyPassword,
} from '@acme/db';
import { AppError } from '../../errors.ts';
import type { SessionUser } from '../../plugins/auth.ts';

export type UserStore = Pick<UserRepository, 'findByEmail'>;
export type SessionStore = Pick<SessionRepository, 'create' | 'findUser' | 'delete'>;

export class AuthService {
  private readonly users: UserStore;
  private readonly sessions: SessionStore;
  // Verified when the email is unknown, so both failures cost about the same time.
  private dummyHash: Promise<string> | undefined;

  constructor(users: UserStore, sessions: SessionStore) {
    this.users = users;
    this.sessions = sessions;
  }

  async login(email: string, password: string): Promise<{ token: string; user: SessionUser }> {
    const user = await this.users.findByEmail(email);
    this.dummyHash ??= hashPassword('dummy-password');
    const isValid = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !isValid) throw new AppError('INVALID_CREDENTIALS');
    const token = await this.sessions.create(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  findSessionUser(token: string): Promise<SessionUser | undefined> {
    return this.sessions.findUser(token);
  }

  logout(token: string): Promise<void> {
    return this.sessions.delete(token);
  }
}
