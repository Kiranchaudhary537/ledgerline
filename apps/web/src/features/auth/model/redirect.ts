/** Only same-site paths: blocks open redirects like `?next=//evil.com`. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/employees';
}

export function loginUrl(here: { pathname: string; search: string }) {
  return `/login?next=${encodeURIComponent(here.pathname + here.search)}`;
}
