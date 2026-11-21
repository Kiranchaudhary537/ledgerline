import type { DepartmentRepository } from '@acme/db';
import { COUNTRIES, EMPLOYMENT_TYPES, type FilterOptions, GENDERS, LEVELS } from '@acme/shared';

export type DepartmentStore = Pick<DepartmentRepository, 'list'>;

const countries = COUNTRIES.map(({ code, name, currency }) => ({ code, name, currency }));

export class MetaService {
  private readonly departments: DepartmentStore;

  constructor(departments: DepartmentStore) {
    this.departments = departments;
  }

  async filterOptions(): Promise<FilterOptions> {
    return {
      countries,
      departments: await this.departments.list(),
      levels: [...LEVELS],
      employmentTypes: [...EMPLOYMENT_TYPES],
      genders: [...GENDERS],
    };
  }
}
