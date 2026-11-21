import {
  COUNTRIES,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  type FilterOptions,
  GENDERS,
  LEVELS,
} from '@acme/shared';
import type { FastifyInstance } from 'fastify';

const options: FilterOptions = {
  countries: COUNTRIES.map(({ code, name, currency }) => ({ code, name, currency })),
  departments: Object.entries(DEPARTMENTS).map(([name, jobTitles]) => ({
    name: name as keyof typeof DEPARTMENTS,
    jobTitles: [...jobTitles],
  })),
  levels: [...LEVELS],
  employmentTypes: [...EMPLOYMENT_TYPES],
  genders: [...GENDERS],
};

export function metaRoutes(app: FastifyInstance) {
  app.get('/api/meta/filters', () => options);
}
