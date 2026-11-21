import { config, emailSchema } from '@acme/shared';
import { createDb } from '../client.ts';
import { seedDatabase } from './seed.ts';

const { DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const adminEmail = emailSchema.parse(SEED_ADMIN_EMAIL);
if (!SEED_ADMIN_PASSWORD || SEED_ADMIN_PASSWORD.length < config.seed.adminPasswordMinLength) {
  throw new Error(
    'SEED_ADMIN_PASSWORD must be at least ${config.seed.adminPasswordMinLength} characters',
  );
}

const db = createDb(DATABASE_URL);
const started = performance.now();
try {
  await seedDatabase(db, { adminEmail, adminPassword: SEED_ADMIN_PASSWORD });
  console.log(
    `Seeded ${config.seed.employeeCount.toLocaleString('en')} employees in ${Math.round(performance.now() - started)} ms`,
  );
} finally {
  await db.destroy();
}
