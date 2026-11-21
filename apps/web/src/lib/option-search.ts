/** Case-insensitive "contains" filter; a blank query keeps everything. */
export function filterByLabel<T extends { label: string }>(options: T[], query: string) {
  const needle = query.trim().toLowerCase();
  return needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
}

/** Next highlighted row for an arrow/Home/End key; stays inside the list, -1 when it is empty. */
export function moveActive(current: number, key: string, length: number) {
  if (length === 0) return -1;
  const last = length - 1;
  if (key === 'ArrowDown') return Math.min(current + 1, last);
  if (key === 'ArrowUp') return Math.max(current - 1, 0);
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  return Math.min(Math.max(current, 0), last);
}
