import type { ListState } from './list-state';

export type ColumnId = 'code' | 'name' | 'department' | 'jobTitle' | 'level' | 'country' | 'salary';

export interface ColumnSpec {
  id: ColumnId;
  label: string;
  /** The API sort field this column's header controls; absent when the API cannot sort by it. */
  sortField?: string;
  align?: 'right';
}

export const COLUMNS: readonly ColumnSpec[] = [
  { id: 'code', label: 'Code' },
  { id: 'name', label: 'Name', sortField: 'name' },
  { id: 'department', label: 'Department' },
  { id: 'jobTitle', label: 'Job title' },
  { id: 'level', label: 'Level', sortField: 'level' },
  { id: 'country', label: 'Country' },
  { id: 'salary', label: 'Salary', sortField: 'salary', align: 'right' },
];

export const SALARY_SORT_HINT = 'Filter to one country to sort by salary';

export type SortDirection = 'asc' | 'desc';

export function parseSort(sort: string) {
  const [field = '', dir = 'asc'] = sort.split(':');
  return { field, dir: dir === 'desc' ? ('desc' as const) : ('asc' as const) };
}

/** Clicking the active column flips its direction; any other column starts ascending. */
export function nextSort(sort: string, field: string) {
  const current = parseSort(sort);
  return `${field}:${current.field === field && current.dir === 'asc' ? 'desc' : 'asc'}`;
}

/** Why a column cannot be sorted right now (money is only comparable inside one country). */
export const sortDisabledHint = (state: ListState, field: string) =>
  field === 'salary' && state.country.length !== 1 ? SALARY_SORT_HINT : undefined;

export function ariaSort(sort: string, field: string | undefined) {
  if (!field) return undefined;
  const current = parseSort(sort);
  if (current.field !== field) return undefined;
  return current.dir === 'asc' ? ('ascending' as const) : ('descending' as const);
}
