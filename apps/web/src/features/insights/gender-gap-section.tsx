import type { GenderGapRow } from '@acme/shared';
import { formatCount, money } from '@/lib/format';
import { Failed, Section, Skeleton, td, th } from './insights-ui';
import type { useGenderGap } from './queries';

const gapText = (pct: number) =>
  pct > 0
    ? `${pct}% (women paid less)`
    : pct < 0
      ? `${Math.abs(pct)}% (women paid more)`
      : '0% (no gap)';

function GenderGapTable({ rows, country }: { rows: GenderGapRow[]; country: string }) {
  const side = (n: number, median: number | null) =>
    n === 0 || median === null ? (
      <span className="text-muted-foreground">No one</span>
    ) : (
      <>
        {money(median, country)}
        <span className="text-xs text-muted-foreground"> ({formatCount(n)})</span>
      </>
    );
  return (
    <div className="overflow-x-auto">
      <table aria-label="Gender gap by role" className="tnum w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={th}>
              Role
            </th>
            <th scope="col" className={`${th} text-right`}>
              Women, median (people)
            </th>
            <th scope="col" className={`${th} text-right`}>
              Men, median (people)
            </th>
            <th scope="col" className={`${th} pr-0 text-right`}>
              Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.group.jobTitle}>
              <td className={td}>{r.group.jobTitle}</td>
              <td className={`${td} text-right`}>{side(r.femaleCount, r.femaleMedian)}</td>
              <td className={`${td} text-right`}>{side(r.maleCount, r.maleMedian)}</td>
              <td className={`${td} pr-0 text-right`}>
                {r.gapPct === null ? (
                  <span className="text-muted-foreground">Not enough data</span>
                ) : (
                  gapText(r.gapPct)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GenderGapSection({
  gap,
  country,
}: {
  gap: ReturnType<typeof useGenderGap>;
  country: string;
}) {
  return (
    <Section title="Gender gap by role">
      <p className="text-muted-foreground">
        Gap is the men’s median minus the women’s, as a share of the men’s. A positive gap means
        women are paid less. Shown when each group has at least 5 people.
      </p>
      {gap.isError ? (
        <Failed error={gap.error} retry={() => void gap.refetch()} />
      ) : gap.data ? (
        <GenderGapTable rows={gap.data} country={country} />
      ) : (
        <Skeleton rows={5} cols={4} />
      )}
    </Section>
  );
}
