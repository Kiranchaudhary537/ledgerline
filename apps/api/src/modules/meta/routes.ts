import { type Db, listDepartments } from '@acme/db';
import { COUNTRIES, EMPLOYMENT_TYPES, type FilterOptions, GENDERS, LEVELS } from '@acme/shared';
import type { FastifyInstance } from 'fastify';

const countries = COUNTRIES.map(({ code, name, currency }) => ({ code, name, currency }));

export function metaRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/api/meta/filters', async (): Promise<FilterOptions> => ({
    countries,
    departments: await listDepartments(db),
    levels: [...LEVELS],
    employmentTypes: [...EMPLOYMENT_TYPES],
    genders: [...GENDERS],
  }));
}
