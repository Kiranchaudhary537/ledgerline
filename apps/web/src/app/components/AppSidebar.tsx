import { BarChart3, LogOut, Users } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { SessionUser } from '@/features/auth/api/session';

const items = [
  { to: '/employees', label: 'Employees', Icon: Users },
  { to: '/insights', label: 'Insights', Icon: BarChart3 },
];

const isCurrent = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`) || (to === '/employees' && pathname === '/');

export function AppSidebar({
  user,
  onLogout,
  loggingOut,
}: {
  user: SessionUser;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b px-4">
        <span translate="no" className="text-base font-semibold whitespace-nowrap">
          <span className="group-data-[collapsible=icon]:hidden">ACME Pay</span>
          <span className="hidden group-data-[collapsible=icon]:inline">AP</span>
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Main">
              <SidebarMenu>
                {items.map(({ to, label, Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      isActive={isCurrent(pathname, to)}
                      className="data-[active=true]:text-sidebar-primary"
                    >
                      <NavLink to={to}>
                        <Icon aria-hidden />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t p-3">
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={loggingOut}
          onClick={onLogout}
          aria-label="Log out"
          className="justify-start px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center"
        >
          <LogOut aria-hidden />
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
