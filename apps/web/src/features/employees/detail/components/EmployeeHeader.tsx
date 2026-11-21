import type { Employee } from '@acme/shared';
import { ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tenureText } from '@/features/employees/detail/model/tenure';
import { formatCount, label } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PagerView {
  position: number;
  total: number;
  /** Detail URLs; null at the ends of the list. */
  prevTo: string | null;
  nextTo: string | null;
}

interface Props {
  employee: Employee;
  countryName: string;
  backTo: string;
  pager: PagerView | null;
  onEdit: () => void;
  onDelete: () => void;
}

const iconButton = buttonVariants({ variant: 'secondary', size: 'icon' });

function StepLink({
  to,
  label: text,
  children,
}: {
  to: string | null;
  label: string;
  children: ReactNode;
}) {
  if (to === null) {
    return (
      <span
        aria-disabled
        role="img"
        aria-label={`${text} (none)`}
        className={cn(iconButton, 'cursor-not-allowed opacity-55')}
      >
        {children}
      </span>
    );
  }
  return (
    <Link to={to} aria-label={text} title={text} className={iconButton}>
      {children}
    </Link>
  );
}

export function EmployeeHeader({
  employee: e,
  countryName,
  backTo,
  pager,
  onEdit,
  onDelete,
}: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 space-y-1">
        <Link
          to={backTo}
          aria-label="Back to employees"
          className="mb-2 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Employees
        </Link>
        <h1 className="text-3xl leading-tight">{e.fullName}</h1>
        <p className="text-base">
          {e.jobTitle}, {label(e.level)}, {countryName}
        </p>
        <p className="flex flex-wrap gap-x-5 text-muted-foreground">
          <span>{tenureText(e.hireDate, new Date())}</span>
          <span>Active</span>
          <span className="font-mono text-xs leading-6">{e.employeeCode}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 self-end">
        {pager && (
          <div className="tnum flex items-center gap-2 text-muted-foreground">
            <StepLink to={pager.prevTo} label="Previous employee">
              <ChevronLeft aria-hidden />
            </StepLink>
            <span aria-live="polite">
              {formatCount(pager.position)} of {formatCount(pager.total)}
            </span>
            <StepLink to={pager.nextTo} label="Next employee">
              <ChevronRight aria-hidden />
            </StepLink>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More actions" className={iconButton}>
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
