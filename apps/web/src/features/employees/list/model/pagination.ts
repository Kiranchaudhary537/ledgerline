import { PAGE_SIZE } from './list-state';

/** "26–50 of 2,818" and "Page 2 of 113" as numbers. */
export function pageRange(page: number, total: number, pageSize = PAGE_SIZE) {
  return {
    first: (page - 1) * pageSize + 1,
    last: Math.min(page * pageSize, total),
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
