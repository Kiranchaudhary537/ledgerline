import {
  hashPassword,
  type SessionRepository,
  type UserRepository,
  verifyPassword,
} from '@acme/db';
import { AppError } from '../../errors.ts';
import type { SessionUser } from '../../plugins/auth.ts';

// Hashed once and verified when the email is unknown, so unknown and wrong-password logins
// take the same time and do not reveal which emails exist.
const DUMMY_PASSWORD = 'dummy-password';

export type UserStore = Pick<UserRepository, 'findByEmail'>;
export type SessionStore = Pick<SessionRepository, 'create' | 'findUser' | 'delete'>;

export class AuthService {
  private readonly users: UserStore;
  private readonly sessions: SessionStore;
  private dummyHash: Promise<string> | undefined;

  constructor(users: UserStore, sessions: SessionStore) {
    this.users = users;
    this.sessions = sessions;
  }

  async login(email: string, password: string): Promise<{ token: string; user: SessionUser }> {
    const user = await this.users.findByEmail(email);
    this.dummyHash ??= hashPassword(DUMMY_PASSWORD);
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
