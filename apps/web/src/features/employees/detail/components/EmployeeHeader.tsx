import type { Employee } from '@acme/shared';
import { ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, StatusPill } from '@/components/ui/pill';
import { initials } from '@/features/employees/shared/model/people';
import { formatCount, formatDate } from '@/lib/format';
import { toneOf } from '@/lib/tone';
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
  onChangeSalary: () => void;
}

const roundButton =
  'inline-flex size-9 items-center justify-center rounded-full border border-border bg-card hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function Meta({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}

function StepLink({
  to,
  label,
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
        className={cn(roundButton, 'cursor-not-allowed opacity-40')}
        role="img"
        aria-label={`${label} (none)`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link to={to} aria-label={label} title={label} className={roundButton}>
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
  onChangeSalary,
}: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
      <Link
        to={backTo}
        aria-label="Back to employees"
        title="Back to employees"
        className={roundButton}
      >
        <ArrowLeft aria-hidden className="size-4" />
      </Link>
      <div className="flex items-center gap-3">
        <Avatar initials={initials(e.fullName)} tone={toneOf(e.fullName)} size="lg" />
        <div className="space-y-1">
          <h1 className="text-2xl leading-tight font-semibold">{e.fullName}</h1>
          <StatusPill>Active</StatusPill>
        </div>
      </div>
      <div aria-hidden className="hidden h-10 w-px bg-border lg:block" />
      <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
        <Meta term="Employee code">{e.employeeCode}</Meta>
        <Meta term="Department">{e.department}</Meta>
        <Meta term="Country">{countryName}</Meta>
        <Meta term="Hire date">{formatDate(e.hireDate)}</Meta>
      </dl>
      <div className="ml-auto flex items-center gap-2">
        {pager && (
          <div className="tnum flex items-center gap-2 text-muted-foreground">
            <StepLink to={pager.prevTo} label="Previous employee">
              <ChevronLeft aria-hidden className="size-4" />
            </StepLink>
            <span aria-live="polite">
              {formatCount(pager.position)} of {formatCount(pager.total)}
            </span>
            <StepLink to={pager.nextTo} label="Next employee">
              <ChevronRight aria-hidden className="size-4" />
            </StepLink>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More actions" className={roundButton}>
            <MoreHorizontal aria-hidden className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onChangeSalary}>Change salary</Button>
      </div>
    </Card>
  );
}
