import type { StatsRow } from '@acme/shared';
import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { railPosition, railScale, type RailScale } from '@/features/employees/band-geometry';
import { BandRail } from '@/features/employees/band-rail';
import { formatCount, label, money } from '@/lib/format';
import { groupByRole, type RoleGroup } from './pay-roles';

export const th =
  'border-b border-border pr-3 pb-1.5 text-left text-xs font-semibold text-muted-foreground';
export const td = 'h-9 border-b border-border pr-3 whitespace-nowrap';
const linkClass =
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Median of each level as a lettered tick, joined by a thin line from the lowest to the highest. */
function PayLadder({
  role,
  scale,
  countryCode,
}: {
  role: RoleGroup;
  scale: RailScale;
  countryCode: string;
}) {
  const left = railPosition(scale, role.lowMedian);
  return (
    <div className="tnum relative h-9">
      <div className="absolute inset-x-0 top-[17px] h-px bg-border" />
      <div
        className="absolute top-[17px] h-px bg-muted-foreground"
        style={{ left: `${left}%`, width: `${railPosition(scale, role.highMedian) - left}%` }}
      />
      {role.levels.map((l) => (
        <span
          key={l.group.level}
          role="img"
          aria-label={`${label(l.group.level ?? '')} median ${money(l.median, countryCode)}`}
          className="absolute top-[9px] flex size-4.5 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground"
          style={{ left: `${railPosition(scale, l.median)}%` }}
        >
          {(l.group.level ?? '').charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}

export function PayByRole({ rows, country }: { rows: StatsRow[]; country: string }) {
  const scale = useMemo(() => railScale(rows), [rows]);
  const roles = useMemo(() => groupByRole(rows), [rows]);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (title: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(title)) next.add(title);
      return next;
    });

  return (
    <div className="overflow-x-auto">
      <table aria-label="Pay by role" className="tnum w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={th}>
              Role
            </th>
            <th scope="col" className={`${th} text-right`}>
              People
            </th>
            <th scope="col" className={`${th} w-1/2 min-w-48`}>
              Pay ladder (median by level)
            </th>
            <th scope="col" className={`${th} pr-0 text-right`}>
              Median range
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => {
            const expanded = open.has(role.jobTitle);
            const to = (level?: string) =>
              `/employees?${new URLSearchParams({ country, jobTitle: role.jobTitle, ...(level && { level }) })}`;
            return (
              <Fragment key={role.jobTitle}>
                <tr className="hover:[&>td]:bg-band-soft/40">
                  <td className={td}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={`${role.jobTitle} levels`}
                      onClick={() => toggle(role.jobTitle)}
                      className="mr-1 inline-flex size-6 items-center justify-center rounded-sm align-middle text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span
                        aria-hidden
                        className={`inline-block motion-safe:transition-transform ${expanded ? 'rotate-90' : ''}`}
                      >
                        ›
                      </span>
                    </button>
                    <Link to={to()} className={`font-semibold ${linkClass}`}>
                      {role.jobTitle}
                    </Link>
                  </td>
                  <td className={`${td} text-right`}>{formatCount(role.count)}</td>
                  <td className="h-9 w-1/2 min-w-48 border-b border-border pr-6">
                    <PayLadder role={role} scale={scale} countryCode={country} />
                  </td>
                  <td className={`${td} pr-0 text-right`}>
                    {role.levels.length > 1
                      ? `${money(role.lowMedian, country)} – ${money(role.highMedian, country)}`
                      : money(role.lowMedian, country)}
                  </td>
                </tr>
                {expanded &&
                  role.levels.map((r) => (
                    <tr key={r.group.level} className="hover:[&>td]:bg-band-soft/40">
                      <td className={`${td} pl-7`}>
                        <Link
                          to={to(r.group.level)}
                          aria-label={`${role.jobTitle}, ${label(r.group.level ?? '')}`}
                          className={linkClass}
                        >
                          {label(r.group.level ?? '')}
                        </Link>
                      </td>
                      <td className={`${td} text-right`}>{formatCount(r.count)}</td>
                      <td className="h-9 w-1/2 min-w-48 border-b border-border pr-6">
                        <BandRail
                          band={r}
                          countryCode={country}
                          markers={[]}
                          scale={scale}
                          showLabels={false}
                        />
                      </td>
                      <td className={`${td} pr-0 text-right`}>{money(r.median, country)}</td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
