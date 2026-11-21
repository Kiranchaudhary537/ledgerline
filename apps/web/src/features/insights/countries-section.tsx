import { formatCount, money } from '@/lib/format';
import { Failed, Section, Skeleton, td, th } from './insights-ui';
import type { useStats } from './queries';

export function CountriesSection({
  overview,
  countryName,
}: {
  overview: ReturnType<typeof useStats>;
  countryName: (code: string) => string;
}) {
  return (
    <Section title="Countries">
      {overview.isError ? (
        <Failed error={overview.error} retry={() => void overview.refetch()} />
      ) : overview.data ? (
        <div className="overflow-x-auto">
          <table aria-label="Countries overview" className="tnum w-full max-w-xl border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Country
                </th>
                <th scope="col" className={`${th} text-right`}>
                  People
                </th>
                <th scope="col" className={`${th} pr-0 text-right`}>
                  Median
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.data.map((r) => {
                const code = r.group.country ?? '';
                return (
                  <tr key={code}>
                    <td className={td}>{countryName(code)}</td>
                    <td className={`${td} text-right`}>{formatCount(r.count)}</td>
                    <td className={`${td} pr-0 text-right`}>{money(r.median, code)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Skeleton rows={5} cols={3} />
      )}
    </Section>
  );
}
