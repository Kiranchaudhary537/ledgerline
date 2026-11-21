import { config, type InsightsStatsRow } from '@acme/shared';
import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { railPosition, railScale, type RailScale } from '@/features/employees/shared/model/band-geometry';
import { BandRail } from '@/features/employees/shared/components/BandRail';
import { formatCount, label, money } from '@/lib/format';
import { td, th } from '@/features/insights/components/Section';
import { compaSpread, groupByRole, isWideSpread, type RoleGroup } from '@/features/insights/model/pay-roles';

const linkClass =
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

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

const ladderCell = 'h-9 w-2/5 min-w-48 border-b border-border pr-6';
const limit = config.compaRatio.maxReviewSpread.toFixed(2);

function OutsideBand({ count }: { count: number }) {
  return count > 0 ? (
    <span className="font-semibold">{formatCount(count)}</span>
  ) : (
    <span className="text-muted-foreground">0</span>
  );
}

/** The p75 - p25 of compa-ratio; flagged quietly when it is wider than the review limit. */
function Spread({ value }: { value: number }) {
  const wide = isWideSpread(value);
  return (
    <span title={wide ? `Wider than ${limit}: worth asking why` : undefined}>
      <span className={wide ? 'font-semibold' : 'text-muted-foreground'}>{value.toFixed(2)}</span>
      {wide && (
        <>
          <span aria-hidden className="ml-1.5 text-xs text-muted-foreground">
            wide
          </span>
          <span className="sr-only">, spread wider than {limit}, worth an explanation</span>
        </>
      )}
    </span>
  );
}

interface RowProps {
  role: RoleGroup;
  scale: RailScale;
  country: string;
}

const roleLink = (country: string, jobTitle: string, level?: string) =>
  `/employees?${new URLSearchParams({ country, jobTitle, ...(level && { level }) })}`;

function RoleRow({
  role,
  scale,
  country,
  expanded,
  onToggle,
}: RowProps & { expanded: boolean; onToggle: () => void }) {
  return (
    <tr className="hover:[&>td]:bg-band-soft/40">
      <td className={td}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${role.jobTitle} levels`}
          onClick={onToggle}
          className="mr-1 inline-flex size-6 items-center justify-center rounded-sm align-middle text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden
            className={`inline-block motion-safe:transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>
        <Link to={roleLink(country, role.jobTitle)} className={`font-semibold ${linkClass}`}>
          {role.jobTitle}
        </Link>
      </td>
      <td className={`${td} text-right`}>{formatCount(role.count)}</td>
      <td className={`${td} text-right`}>
        <OutsideBand count={role.outOfBand} />
      </td>
      <td className={`${td} text-right`}>
        <Spread value={role.spread} />
      </td>
      <td className={ladderCell}>
        <PayLadder role={role} scale={scale} countryCode={country} />
      </td>
      <td className={`${td} pr-0 text-right`}>
        {role.levels.length > 1
          ? `${money(role.lowMedian, country)} – ${money(role.highMedian, country)}`
          : money(role.lowMedian, country)}
      </td>
    </tr>
  );
}

function LevelRow({ role, scale, country, row }: RowProps & { row: InsightsStatsRow }) {
  const level = row.group.level ?? '';
  return (
    <tr className="hover:[&>td]:bg-band-soft/40">
      <td className={`${td} pl-7`}>
        <Link
          to={roleLink(country, role.jobTitle, row.group.level)}
          aria-label={`${role.jobTitle}, ${label(level)}`}
          className={linkClass}
        >
          {label(level)}
        </Link>
      </td>
      <td className={`${td} text-right`}>{formatCount(row.count)}</td>
      <td className={`${td} text-right`}>
        <OutsideBand count={row.outOfBandCount} />
      </td>
      <td className={`${td} text-right`}>
        <Spread value={compaSpread(row)} />
      </td>
      <td className={ladderCell}>
        <BandRail band={row} countryCode={country} markers={[]} scale={scale} showLabels={false} />
      </td>
      <td className={`${td} pr-0 text-right`}>{money(row.median, country)}</td>
    </tr>
  );
}

function useToggleSet() {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  return [open, toggle] as const;
}

export function PayByRole({ rows, country }: { rows: InsightsStatsRow[]; country: string }) {
  const scale = useMemo(() => railScale(rows), [rows]);
  const roles = useMemo(() => groupByRole(rows), [rows]);
  const [open, toggle] = useToggleSet();

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
            <th scope="col" className={`${th} text-right`}>
              Outside band
            </th>
            <th scope="col" className={`${th} text-right`}>
              Compa spread
            </th>
            <th scope="col" className={`${th} w-2/5 min-w-48`}>
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
            return (
              <Fragment key={role.jobTitle}>
                <RoleRow
                  role={role}
                  scale={scale}
                  country={country}
                  expanded={expanded}
                  onToggle={() => toggle(role.jobTitle)}
                />
                {expanded &&
                  role.levels.map((row) => (
                    <LevelRow
                      key={row.group.level}
                      role={role}
                      scale={scale}
                      country={country}
                      row={row}
                    />
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
