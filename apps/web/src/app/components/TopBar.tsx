import { LogOut, Plus } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/pill';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SessionUser } from '@/features/auth/api/session';
import { initials } from '@/features/employees/shared/model/people';
import type { Crumb } from '@/app/breadcrumbs';

/** The ring on graphite needs the lighter cobalt to keep 3:1. */
const onBar = 'focus-visible:outline-accent-2';

interface Props {
  crumbs: Crumb[];
  user: SessionUser;
  onAddEmployee: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export function TopBar({ crumbs, user, onAddEmployee, onLogout, loggingOut }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-graphite px-4 text-graphite-ink">
      <Link
        to="/employees"
        translate="no"
        className={`font-display text-lg font-semibold tracking-display ${onBar}`}
      >
        ACME&nbsp;Pay
      </Link>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-graphite-muted">
          {crumbs.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && <li aria-hidden>/</li>}
              <li className={i === crumbs.length - 1 ? 'truncate text-graphite-ink' : ''}>
                {c.to ? (
                  <Link to={c.to} className={`hover:text-graphite-ink ${onBar}`}>
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <button
        type="button"
        aria-label="Add employee"
        title="Add employee"
        onClick={onAddEmployee}
        className={`key key-icon ${onBar}`}
      >
        <Plus aria-hidden className="size-5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Account menu for ${user.name}`}
          className={`cut-s flex items-center gap-2 border-transparent bg-transparent py-1 pr-2 pl-1 hover:bg-graphite-2 data-[state=open]:bg-graphite-2 ${onBar}`}
        >
          <Avatar
            initials={initials(user.name)}
            size="sm"
            className="bg-graphite-2 text-graphite-ink"
          />
          <span className="hidden sm:inline">{user.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={loggingOut} onSelect={onLogout}>
            <LogOut aria-hidden className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
