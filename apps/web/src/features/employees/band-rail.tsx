import { money } from '@/lib/format';
import { railLayout, type Band } from './band-geometry';

export interface RailMarker {
  value: number;
  /** current = filled dot, proposed = hollow dot */
  kind: 'current' | 'proposed';
}

/** The band rail: p25 to p75 segment, median tick, and a dot per marker. See docs/ui-design.md. */
export function BandRail({
  band,
  countryCode,
  markers,
}: {
  band: Band;
  countryCode: string;
  markers: RailMarker[];
}) {
  const layout = railLayout(
    band,
    markers.map((m) => m.value),
  );
  const summary =
    `Pay band: middle half ${money(band.p25, countryCode)} to ${money(band.p75, countryCode)}, ` +
    `median ${money(band.median, countryCode)}` +
    markers
      .map((m) => `, ${m.kind === 'current' ? 'current' : 'new'} ${money(m.value, countryCode)}`)
      .join('');
  return (
    <div role="img" aria-label={summary} className="tnum relative h-9">
      <div className="absolute inset-x-0 top-[13px] h-0.5 bg-border" />
      <div
        className="absolute top-[9px] h-2.5 rounded-sm bg-band-soft"
        style={{ left: `${layout.p25}%`, width: `${layout.p75 - layout.p25}%` }}
      />
      <div
        className="absolute top-[5px] h-[18px] w-0.5 bg-muted-foreground"
        style={{ left: `${layout.median}%` }}
      />
      {markers.map((m, i) => (
        <div
          key={m.kind}
          className={
            m.kind === 'current'
              ? 'absolute top-[7px] -ml-[7px] size-3.5 rounded-full bg-primary shadow-[0_0_0_3px_var(--background)]'
              : 'absolute top-[7px] -ml-[7px] size-3.5 rounded-full border-2 border-primary bg-background'
          }
          style={{ left: `${layout.values[i]}%` }}
        />
      ))}
      <span
        className="absolute top-6 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground"
        style={{ left: `${layout.p25}%` }}
      >
        {money(band.p25, countryCode)}
      </span>
      <span
        className="absolute top-6 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground"
        style={{ left: `${layout.p75}%` }}
      >
        {money(band.p75, countryCode)}
      </span>
    </div>
  );
}
