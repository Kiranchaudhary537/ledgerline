import { BarChart3, Users } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

const items = [
  { to: '/employees', label: 'Employees', Icon: Users },
  { to: '/insights', label: 'Insights', Icon: BarChart3 },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Main"
      className="sticky top-14 flex h-[calc(100dvh-3.5rem)] w-[72px] shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3"
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            cn(
              'flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isActive && 'bg-primary-soft font-semibold text-primary hover:text-primary',
            )
          }
        >
          <Icon aria-hidden className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
