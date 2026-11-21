import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, Failed, RowsSkeleton } from '@/components/ui/states';
import {
  freshIds,
  newestFirst,
  REASON_PILL,
  type HistoryRow,
} from '@/features/employees/detail/model/history';
import { formatDate, formatPercent, money } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  rows: HistoryRow[] | undefined;
  error: unknown;
  onRetry: () => void;
  countryCode: string;
}

/** Newest first: when, from to, how much, why, who. Rows that arrive after the first paint slide in. */
export function HistoryTimeline({ rows, error, onRetry, countryCode }: Props) {
  const seen = useRef<Set<number> | null>(null);
  // The first batch is the page as loaded, not news: only later arrivals animate.
  const fresh = rows && seen.current ? freshIds(seen.current, rows) : new Set<number>();
  useEffect(() => {
    if (rows) seen.current = new Set(rows.map((r) => r.id));
  }, [rows]);

  return (
    <Card role="region" aria-labelledby="history-title">
      <CardHeader className="pb-4">
        <CardTitle id="history-title">Salary history</CardTitle>
      </CardHeader>
      {error ? (
        <Failed error={error} retry={onRetry} />
      ) : !rows ? (
        <RowsSkeleton rows={3} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No salary changes yet"
          description="Each change to this salary is listed here with its reason and who made it."
        />
      ) : (
        <ol className="divide-y border-t">
          {newestFirst(rows).map((r) => (
            <li
              key={r.id}
              className={cn(
                'grid grid-cols-[7.5rem_1fr] gap-x-6 gap-y-1 px-5 py-3 sm:grid-cols-[7.5rem_minmax(0,1.4fr)_5rem_minmax(0,1fr)_7rem]',
                fresh.has(r.id) && 'row-in',
              )}
            >
              <time dateTime={r.changedAt} className="text-muted-foreground">
                {formatDate(r.changedAt)}
              </time>
              <span className="tnum">
                {r.oldMinor !== null && (
                  <>
                    {money(r.oldMinor, countryCode)}
                    <span className="text-muted-foreground"> to </span>
                  </>
                )}
                <span className="font-medium">{money(r.newMinor, countryCode)}</span>
              </span>
              <span className="tnum sm:text-right">
                {r.change === null ? '' : formatPercent(r.change)}
              </span>
              <span className="min-w-0 truncate" title={r.reason}>
                {REASON_PILL[r.reasonKind].text ?? r.reason}
              </span>
              <span className="text-muted-foreground sm:text-right">{r.changedBy}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
