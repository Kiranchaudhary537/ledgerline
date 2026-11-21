import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/pill';
import { EmptyState, Failed, RowsSkeleton } from '@/components/ui/states';
import { SortButton, Table, Td, Th, rowHover } from '@/components/ui/table';
import {
  REASON_PILL,
  sortHistoryRows,
  type HistoryKey,
  type HistoryRow,
} from '@/features/employees/detail/model/history';
import { formatDate, formatPercent, money } from '@/lib/format';

interface Props {
  rows: HistoryRow[] | undefined;
  error: unknown;
  onRetry: () => void;
  countryCode: string;
}

const COLUMNS: { key: HistoryKey; label: string; right?: boolean }[] = [
  { key: 'date', label: 'Date' },
  { key: 'from', label: 'From', right: true },
  { key: 'to', label: 'To', right: true },
  { key: 'change', label: 'Change %', right: true },
  { key: 'reason', label: 'Reason' },
  { key: 'by', label: 'Changed by' },
];

export function HistoryCard({ rows, error, onRetry, countryCode }: Props) {
  const [sort, setSort] = useState<{ key: HistoryKey; dir: 'asc' | 'desc' }>({
    key: 'date',
    dir: 'desc',
  });
  const sorted = rows ? sortHistoryRows(rows, sort.key, sort.dir) : [];
  const onSort = (key: HistoryKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return (
    <Card className="overflow-hidden" aria-labelledby="history-title" role="region">
      <CardHeader className="pb-4">
        <CardTitle id="history-title">Salary history</CardTitle>
      </CardHeader>
      {error ? (
        <Failed error={error} retry={onRetry} />
      ) : !rows ? (
        <RowsSkeleton rows={3} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No salary changes yet" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <Th
                    key={c.key}
                    align={c.right ? 'right' : 'left'}
                    aria-sort={
                      sort.key === c.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <SortButton
                      direction={sort.key === c.key ? sort.dir : null}
                      onClick={() => onSort(c.key)}
                      alignRight={!!c.right}
                    >
                      {c.label}
                    </SortButton>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const pill = REASON_PILL[r.reasonKind];
                return (
                  <tr key={r.id} className={rowHover}>
                    <Td>{formatDate(r.changedAt)}</Td>
                    <Td align="right">
                      {r.oldMinor === null ? (
                        <span className="text-muted">None</span>
                      ) : (
                        money(r.oldMinor, countryCode)
                      )}
                    </Td>
                    <Td align="right">{money(r.newMinor, countryCode)}</Td>
                    <Td align="right">{r.change === null ? '' : formatPercent(r.change)}</Td>
                    <Td className="max-w-[28ch] truncate" title={r.reason}>
                      <Chip>{pill.text ?? r.reason}</Chip>
                    </Td>
                    <Td>{r.changedBy}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
