export interface PagerInput {
  id: number;
  page: number;
  pageSize: number;
  total: number;
  /** Ids on `page`, in list order. */
  ids: number[];
  /** Last id of the previous page and first id of the next page, when those pages are known. */
  before?: number | undefined;
  after?: number | undefined;
}

export interface PagerLink {
  id: number;
  /** The list page that contains `id`, so the list URL stays correct after moving. */
  page: number;
}

/** Where an employee sits in the current list query; null when they are not on `page`. */
export function locate({ id, page, pageSize, total, ids, before, after }: PagerInput) {
  const index = ids.indexOf(id);
  if (index === -1) return null;
  const neighbour = (otherId: number | undefined, otherPage: number): PagerLink | null =>
    otherId === undefined ? null : { id: otherId, page: otherPage };
  return {
    position: (page - 1) * pageSize + index + 1,
    total,
    prev: index > 0 ? { id: ids[index - 1]!, page } : neighbour(before, page - 1),
    next: index < ids.length - 1 ? { id: ids[index + 1]!, page } : neighbour(after, page + 1),
  };
}
