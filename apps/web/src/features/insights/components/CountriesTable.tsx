import type { StatsRow } from '@acme/shared';
import { Table, Td, Th, rowHover } from '@/components/ui/table';
import { formatCount, money } from '@/lib/format';

export function CountriesTable({
  rows,
  countryName,
  selected,
  onSelect,
}: {
  rows: StatsRow[];
  countryName: (code: string) => string;
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table aria-label="Countries overview">
        <thead>
          <tr>
            <Th>Country</Th>
            <Th align="right">People</Th>
            <Th align="right">Median</Th>
            <Th align="right">Annual payroll</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const code = r.group.country ?? '';
            const current = code === selected;
            return (
              <tr key={code} className={rowHover}>
                <Td>
                  <button
                    type="button"
                    aria-current={current || undefined}
                    onClick={() => onSelect(code)}
                    className={`underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${current ? 'font-semibold' : ''}`}
                  >
                    {countryName(code)}
                  </button>
                </Td>
                <Td align="right">{formatCount(r.count)}</Td>
                <Td align="right">{money(r.median, code)}</Td>
                <Td align="right">{money(r.total, code)}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
