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

/** Pill text and category colour per kind; "other" shows the reason as written. */
export const REASON_PILL: Record<ReasonKind, { text: string | null; tone: number }> = {
  start: { text: 'Starting salary', tone: 1 },
  review: { text: 'Annual review', tone: 0 },
  promotion: { text: 'Promotion', tone: 3 },
  other: { text: null, tone: 2 },
};

export type HistoryKey = 'date' | 'from' | 'to' | 'change' | 'reason' | 'by';

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

const sortValue: Record<HistoryKey, (r: HistoryRow) => string | number> = {
  date: (r) => r.changedAt,
  from: (r) => r.oldMinor ?? -1,
  to: (r) => r.newMinor,
  change: (r) => r.change ?? -Infinity,
  reason: (r) => r.reason.toLowerCase(),
  by: (r) => r.changedBy.toLowerCase(),
};

export function sortHistoryRows(rows: HistoryRow[], key: HistoryKey, dir: 'asc' | 'desc') {
  const value = sortValue[key];
  const sign = dir === 'asc' ? 1 : -1;
  return rows.toSorted((a, b) => {
    const [x, y] = [value(a), value(b)];
    return (x < y ? -1 : x > y ? 1 : 0) * sign;
  });
}
