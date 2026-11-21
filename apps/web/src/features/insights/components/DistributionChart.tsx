import type { Distribution } from '@acme/shared';
import { Histogram, type Spread } from './Histogram';

export function DistributionChart({
  data,
  country,
  countryName,
  spread,
}: {
  data: Distribution;
  country: string;
  countryName: string;
  spread: Spread | undefined;
}) {
  return (
    <div className="px-5 pb-5">
      <Histogram
        data={data}
        countryCode={country}
        name={`Salaries in ${countryName}`}
        spread={spread}
      />
    </div>
  );
}
