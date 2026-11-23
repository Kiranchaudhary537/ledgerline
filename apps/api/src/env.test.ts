import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.ts';

describe('loadEnv', () => {
  it('fills defaults and turns PORT into a number', () => {
    expect(loadEnv({ DATABASE_URL: 'postgres://x', PORT: '8080' })).toEqual({
      DATABASE_URL: 'postgres://x',
      PORT: 8080,
      HOST: '0.0.0.0',
      NODE_ENV: 'development',
      RENDER_GIT_COMMIT: 'dev',
    });
  });

  it('names every bad variable but never echoes a value', () => {
    const secret = 'postgres://user:hunter2@db';
    const load = () => loadEnv({ DATABASE_URL: '', PORT: secret, NODE_ENV: 'staging' });
    expect(load).toThrow('Invalid environment variables: DATABASE_URL, PORT, NODE_ENV');
    expect(load).not.toThrow(/hunter2|staging/);
  });
});
