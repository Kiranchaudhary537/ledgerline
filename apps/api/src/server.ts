import { createDb } from '@acme/db';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const app = buildApp({ db, logger: { level: 'info' } });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await db.destroy();
    process.exit(0);
  });
}

await app.listen({ port: config.PORT, host: config.HOST });
