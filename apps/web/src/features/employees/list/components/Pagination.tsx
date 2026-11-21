import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/format';
import { PAGE_SIZE } from '@/features/employees/list/model/list-state';

export function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return (
    <nav aria-label="Pages" className="tnum flex items-center justify-end gap-3">
      <span className="text-muted-foreground">
        {formatCount(first)}–{formatCount(last)} of {formatCount(total)}
      </span>
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span>
        Page {page} of {formatCount(pages)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
