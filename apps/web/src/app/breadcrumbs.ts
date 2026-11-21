export interface Crumb {
  label: string;
  /** Absent for the page you are on. */
  to?: string;
}

/** Top-bar trail for a path: "Employees / Sandeep Singh". `employeeName` fills the detail page. */
export function breadcrumbs(pathname: string, employeeName?: string): Crumb[] {
  if (pathname.startsWith('/insights')) return [{ label: 'Insights' }];
  if (/^\/employees\/[^/]+/.test(pathname)) {
    return [{ label: 'Employees', to: '/employees' }, { label: employeeName ?? '…' }];
  }
  return [{ label: 'Employees' }];
}
