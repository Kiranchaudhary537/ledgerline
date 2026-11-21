import { Fragment } from 'react';
import { Link } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { Crumb } from '@/app/breadcrumbs';

/** Sidebar toggle, where you are, and a slot the page fills with its own actions (see PageActions). */
export function SiteHeader({
  crumbs,
  actionsRef,
}: {
  crumbs: Crumb[];
  actionsRef: (el: HTMLDivElement | null) => void;
}) {
  const root = crumbs.length === 1;
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger aria-label="Toggle sidebar" className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      {root ? (
        <h1 className="text-base font-semibold">{crumbs[0]?.label}</h1>
      ) : (
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="min-w-0">
                  {c.to ? (
                    <BreadcrumbLink asChild>
                      <Link to={c.to}>{c.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div ref={actionsRef} className="ml-auto flex items-center gap-2" />
    </header>
  );
}
