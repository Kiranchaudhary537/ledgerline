import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/format';
import { pageRange } from '@/features/employees/list/model/pagination';

export function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const { first, last, pages } = pageRange(page, total);
  return (
    <nav
      aria-label="Pages"
      className="tnum flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
    >
      <span className="text-muted-foreground">
        {formatCount(first)} to {formatCount(last)} of {formatCount(total)}
      </span>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft aria-hidden className="size-4" />
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
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
