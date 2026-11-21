import { createDb } from '@acme/db';
import { buildApp } from './app.ts';
import { loadEnv } from './env.ts';

const env = loadEnv();
const db = createDb(env.DATABASE_URL);
const app = buildApp({
  db,
  logger: { level: 'info' },
  cookieSecure: env.NODE_ENV === 'production',
  trustProxy: env.NODE_ENV === 'production',
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await db.destroy();
    process.exit(0);
  });
}

await app.listen({ port: env.PORT, host: env.HOST });
