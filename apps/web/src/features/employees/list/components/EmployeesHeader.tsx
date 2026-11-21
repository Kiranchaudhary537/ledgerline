import { Download, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatCount } from '@/lib/format';

export function EmployeesHeader({
  total,
  exportHref,
  onAdd,
}: {
  total: number | undefined;
  exportHref: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl">Employees</h1>
        <p className="tnum text-muted" aria-live="polite">
          {total === undefined ? ' ' : `${formatCount(total)} employees`}
        </p>
      </div>
      <div className="flex gap-2">
        <a href={exportHref} className={buttonVariants({ variant: 'secondary' })}>
          <Download aria-hidden className="size-4" />
          Export CSV
        </a>
        <Button onClick={onAdd}>
          <Plus aria-hidden className="size-4" />
          Add employee
        </Button>
      </div>
    </div>
  );
}
