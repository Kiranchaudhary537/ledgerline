import type { Facet } from '@acme/shared';
import type { Option } from '@/components/ui/multi-select';
import type { MultiKey } from './list-state';

export interface FilterSpec {
  key: MultiKey;
  name: string;
  /** Open-ended lists get a search box; the short fixed ones (level, type, gender) do not. */
  searchable: boolean;
  /** Shown only after "More filters". */
  secondary: boolean;
}

export const FILTERS: readonly FilterSpec[] = [
  { key: 'country', name: 'Country', searchable: true, secondary: false },
  { key: 'department', name: 'Department', searchable: true, secondary: false },
  { key: 'jobTitle', name: 'Job title', searchable: true, secondary: false },
  { key: 'level', name: 'Level', searchable: false, secondary: false },
  { key: 'employmentType', name: 'Employment type', searchable: false, secondary: true },
  { key: 'gender', name: 'Gender', searchable: false, secondary: true },
];

export const facetOptions = (
  facet: Facet[] | undefined,
  labelOf: (value: string) => string,
): Option[] => (facet ?? []).map(({ value, count }) => ({ value, label: labelOf(value), count }));
