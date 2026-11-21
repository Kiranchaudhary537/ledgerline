import { formatCount, money } from '@/lib/format';
import { Failed, Section, Skeleton, td, th } from './insights-ui';
import type { useStats } from './queries';
import { outsideShare } from './scorecard';

export function CountriesSection({
  overview,
  countryName,
  selected,
  onSelect,
}: {
  overview: ReturnType<typeof useStats>;
  countryName: (code: string) => string;
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <Section title="Countries">
      {overview.isError ? (
        <Failed error={overview.error} retry={() => void overview.refetch()} />
      ) : overview.data ? (
        <div className="overflow-x-auto">
          <table aria-label="Countries overview" className="tnum w-full max-w-3xl border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Country
                </th>
                <th scope="col" className={`${th} text-right`}>
                  People
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Median
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Average compa-ratio
                </th>
                <th scope="col" className={`${th} pr-0 text-right`}>
                  Outside band
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.data.map((r) => {
                const code = r.group.country ?? '';
                const current = code === selected;
                return (
                  <tr key={code} className="hover:[&>td]:bg-band-soft/40">
                    <td className={td}>
                      <button
                        type="button"
                        aria-current={current || undefined}
                        onClick={() => onSelect(code)}
                        className={`underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${current ? 'font-semibold' : ''}`}
                      >
                        {countryName(code)}
                      </button>
                    </td>
                    <td className={`${td} text-right`}>{formatCount(r.count)}</td>
                    <td className={`${td} text-right`}>{money(r.median, code)}</td>
                    <td className={`${td} text-right`}>{r.avgCompaRatio.toFixed(2)}</td>
                    <td className={`${td} pr-0 text-right`}>{outsideShare(r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Skeleton rows={5} cols={5} />
      )}
    </Section>
  );
}
