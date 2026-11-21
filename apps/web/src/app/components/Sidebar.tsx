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
      className="sticky top-14 flex h-[calc(100dvh-3.5rem)] w-20 shrink-0 flex-col items-center gap-2 border-r border-rule bg-paper-2 py-3"
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            cn(
              'cut-s flex w-16 flex-col items-center gap-1 border-transparent bg-transparent py-2 text-xs text-muted hover:text-ink',
              isActive && 'border-accent bg-accent-wash font-medium text-accent hover:text-accent',
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
