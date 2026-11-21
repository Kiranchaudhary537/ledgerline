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
import { toneOf } from '@/lib/tone';
import type { Crumb } from '@/app/breadcrumbs';

const onInk =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-foreground';

interface Props {
  crumbs: Crumb[];
  user: SessionUser;
  onAddEmployee: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export function TopBar({ crumbs, user, onAddEmployee, onLogout, loggingOut }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-ink px-4 text-ink-foreground">
      <Link to="/employees" translate="no" className={`font-semibold ${onInk}`}>
        ACME&nbsp;Pay
      </Link>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-ink-muted">
          {crumbs.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && <li aria-hidden>/</li>}
              <li className={i === crumbs.length - 1 ? 'truncate text-ink-foreground' : ''}>
                {c.to ? (
                  <Link to={c.to} className={`hover:text-ink-foreground ${onInk}`}>
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
        className={`inline-flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground hover:brightness-95 ${onInk}`}
      >
        <Plus aria-hidden className="size-5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Account menu for ${user.name}`}
          className={`flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-white/10 ${onInk}`}
        >
          <Avatar initials={initials(user.name)} tone={toneOf(user.name)} size="sm" />
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
