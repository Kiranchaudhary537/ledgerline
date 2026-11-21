import { config, SORT_OPTIONS } from '@acme/shared';

export const MULTI_KEYS = [
  'country',
  'department',
  'jobTitle',
  'level',
  'employmentType',
  'gender',
] as const;
export type MultiKey = (typeof MULTI_KEYS)[number];

export const DEFAULT_SORT = 'name:asc';
export const PAGE_SIZE = config.paging.defaultPageSize;

export type ListState = { q: string; sort: string; page: number } & Record<MultiKey, string[]>;

const csv = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

export function parseListState(params: URLSearchParams): ListState {
  const state = { q: (params.get('q') ?? '').trim() } as ListState;
  for (const key of MULTI_KEYS) state[key] = csv(params.get(key));

  const sort = params.get('sort') ?? DEFAULT_SORT;
  const known = (SORT_OPTIONS as readonly string[]).includes(sort);
  const salaryOk = !sort.startsWith('salary') || state.country.length === 1;
  state.sort = known && salaryOk ? sort : DEFAULT_SORT;

  const page = Number(params.get('page'));
  state.page = Number.isInteger(page) && page >= 1 ? page : 1;
  return state;
}

/** Defaults are left out so a plain list has a plain URL. `page: false` is for the CSV export. */
export function listToParams(state: ListState, opts: { page?: boolean } = {}) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  for (const key of MULTI_KEYS) if (state[key].length) params.set(key, state[key].join(','));
  if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
  if (opts.page !== false && state.page > 1) params.set('page', String(state.page));
  return params;
}

/** What the API gets: a search under 2 characters is not sent. */
export function listToApiParams(state: ListState) {
  const params = listToParams(state);
  if (state.q.length < 2) params.delete('q');
  params.set('sort', state.sort);
  params.set('page', String(state.page));
  params.set('pageSize', String(PAGE_SIZE));
  return params;
}

/** The filters only: facets are not sorted or paged. */
export function listToFacetParams(state: ListState) {
  const params = listToParams(state, { page: false });
  params.delete('sort');
  if (state.q.length < 2) params.delete('q');
  return params;
}

export function exportParams(state: ListState) {
  const params = listToParams(state, { page: false });
  if (state.q.length < 2) params.delete('q');
  params.set('sort', state.sort);
  return params;
}

export const hasFilters = (s: ListState) => !!s.q || MULTI_KEYS.some((k) => s[k].length > 0);
