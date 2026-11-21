import { config } from '@acme/shared';
import { cn } from '@/lib/utils';

export function CompaRatioCell({ value }: { value: number }) {
  const low = value < config.compaRatio.extremeLow;
  const high = value > config.compaRatio.extremeHigh;
  return (
    <span className={cn('tnum', (low || high) && 'font-semibold text-destructive')}>
      {(low || high) && (
        <>
          <span aria-hidden className="mr-1 text-xs">
            {low ? '▼' : '▲'}
          </span>
          <span className="sr-only">{low ? 'Below range: ' : 'Above range: '}</span>
        </>
      )}
      {value.toFixed(2)}
    </span>
  );
}
