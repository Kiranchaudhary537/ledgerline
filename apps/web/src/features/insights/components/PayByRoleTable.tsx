import type { StatsRow } from '@acme/shared';
import { ChevronRight } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Table, Td, Th, rowHover } from '@/components/ui/table';
import {
  bandScale,
  scalePosition,
  type BandScale,
} from '@/features/employees/shared/model/band-geometry';
import { PayBand } from '@/features/employees/shared/components/PayBand';
import { groupByRole, type RoleGroup } from '@/features/insights/model/pay-roles';
import { formatCount, label, money } from '@/lib/format';
import { cn } from '@/lib/utils';

const linkClass = 'underline-offset-4 hover:underline';

function PayLadder({
  role,
  scale,
  countryCode,
}: {
  role: RoleGroup;
  scale: BandScale;
  countryCode: string;
}) {
  const left = scalePosition(scale, role.lowMedian);
  return (
    <div className="tnum relative h-9">
      <div className="absolute inset-x-0 top-[17px] h-px bg-muted-foreground/30" />
      <div
        className="absolute top-[17px] h-0.5 bg-muted-foreground/60"
        style={{ left: `${left}%`, width: `${scalePosition(scale, role.highMedian) - left}%` }}
      />
      {role.levels.map((l) => (
        <span
          key={l.group.level}
          role="img"
          aria-label={`${label(l.group.level ?? '')} median ${money(l.median, countryCode)}`}
          className="absolute top-[7px] flex size-5 -translate-x-1/2 items-center justify-center border border-foreground/60 bg-card text-xs leading-none font-medium text-foreground"
          style={{ left: `${scalePosition(scale, l.median)}%` }}
        >
          {(l.group.level ?? '').charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}

const ladderCell = 'w-2/5 min-w-56';

interface RowProps {
  role: RoleGroup;
  scale: BandScale;
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
    <tr className={rowHover}>
      <Td>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${role.jobTitle} levels`}
          onClick={onToggle}
          className="mr-1 inline-flex size-6 items-center justify-center align-middle text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronRight
            aria-hidden
            className={cn('size-4 transition-transform', expanded && 'rotate-90')}
          />
        </button>
        <Link to={roleLink(country, role.jobTitle)} className={`font-medium ${linkClass}`}>
          {role.jobTitle}
        </Link>
      </Td>
      <Td align="right">{formatCount(role.count)}</Td>
      <Td className={ladderCell}>
        <PayLadder role={role} scale={scale} countryCode={country} />
      </Td>
      <Td align="right">
        {role.levels.length > 1
          ? `${money(role.lowMedian, country)} – ${money(role.highMedian, country)}`
          : money(role.lowMedian, country)}
      </Td>
    </tr>
  );
}

function LevelRow({ role, scale, country, row }: RowProps & { row: StatsRow }) {
  const level = row.group.level ?? '';
  return (
    <tr className={rowHover}>
      <Td className="pl-14">
        <Link
          to={roleLink(country, role.jobTitle, row.group.level)}
          aria-label={`${role.jobTitle}, ${label(level)}`}
          className={linkClass}
        >
          {label(level)}
        </Link>
      </Td>
      <Td align="right">{formatCount(row.count)}</Td>
      <Td className={ladderCell}>
        <PayBand size="compact" band={row} countryCode={country} scale={scale} />
      </Td>
      <Td align="right">{money(row.median, country)}</Td>
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

export function PayByRoleTable({ rows, country }: { rows: StatsRow[]; country: string }) {
  const scale = useMemo(() => bandScale(rows), [rows]);
  const roles = useMemo(() => groupByRole(rows), [rows]);
  const [open, toggle] = useToggleSet();

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Pay by role">
        <thead>
          <tr>
            <Th>Role</Th>
            <Th align="right">People</Th>
            <Th className={ladderCell}>Pay ladder (median by level)</Th>
            <Th align="right">Median range</Th>
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
      </Table>
    </div>
  );
}
