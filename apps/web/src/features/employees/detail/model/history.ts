import type { SalaryChange } from '@acme/shared';
import { percentChange } from '@/features/employees/shared/model/band-geometry';

export type ReasonKind = 'start' | 'review' | 'promotion' | 'other';

export interface HistoryRow {
  id: number;
  changedAt: string;
  oldMinor: number | null;
  newMinor: number;
  /** Fraction, null for the starting salary. */
  change: number | null;
  reasonKind: ReasonKind;
  reason: string;
  changedBy: string;
}

/** Chip text per kind; "other" shows the reason as written. */
export const REASON_PILL: Record<ReasonKind, { text: string | null }> = {
  start: { text: 'Starting salary' },
  review: { text: 'Annual review' },
  promotion: { text: 'Promotion' },
  other: { text: null },
};

/** The reasons HR uses most get their own pill; anything else shows its own text. */
export function reasonKind(change: Pick<SalaryChange, 'oldSalaryMinor' | 'reason'>): ReasonKind {
  if (change.oldSalaryMinor === null) return 'start';
  const reason = change.reason.toLowerCase();
  if (reason.includes('promotion')) return 'promotion';
  if (reason.includes('review')) return 'review';
  return 'other';
}

export const toHistoryRows = (changes: SalaryChange[]): HistoryRow[] =>
  changes.map((c) => ({
    id: c.id,
    changedAt: c.changedAt,
    oldMinor: c.oldSalaryMinor,
    newMinor: c.newSalaryMinor,
    change: c.oldSalaryMinor === null ? null : percentChange(c.oldSalaryMinor, c.newSalaryMinor),
    reasonKind: reasonKind(c),
    reason: c.reason,
    changedBy: c.changedByName ?? 'Imported',
  }));

/** Rows in `rows` that were not in `seen`: what just arrived, so only they animate in. */
export const freshIds = (seen: ReadonlySet<number>, rows: HistoryRow[]) =>
  new Set(rows.filter((r) => !seen.has(r.id)).map((r) => r.id));

/** Newest first, as the timeline reads. */
export const newestFirst = (rows: HistoryRow[]) =>
  rows.toSorted((a, b) => b.changedAt.localeCompare(a.changedAt));

export interface SalaryStep {
  /** ms since epoch. */
  at: number;
  salaryMinor: number;
}

/** The salary as a step line: one point per change, then a point at `now` so the last step runs to today. */
export function salarySteps(rows: HistoryRow[], now: number): SalaryStep[] {
  const steps = rows
    .toSorted((a, b) => a.changedAt.localeCompare(b.changedAt))
    .map((r) => ({ at: Date.parse(r.changedAt), salaryMinor: r.newMinor }));
  const last = steps.at(-1);
  return last && last.at < now ? [...steps, { at: now, salaryMinor: last.salaryMinor }] : steps;
}
