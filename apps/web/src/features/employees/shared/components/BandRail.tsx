import { money } from '@/lib/format';
import {
  railLayout,
  type Band,
  type RailScale,
} from '@/features/employees/shared/model/band-geometry';

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
  scale,
  showLabels = true,
}: {
  band: Band;
  countryCode: string;
  markers: RailMarker[];
  /** Shared scale for rails that are compared side by side. */
  scale?: RailScale;
  showLabels?: boolean;
}) {
  const layout = railLayout(
    band,
    markers.map((m) => m.value),
    scale,
  );
  const summary =
    `Pay band: middle half ${money(band.p25, countryCode)} to ${money(band.p75, countryCode)}, ` +
    `median ${money(band.median, countryCode)}` +
    markers
      .map((m) => `, ${m.kind === 'current' ? 'current' : 'new'} ${money(m.value, countryCode)}`)
      .join('');
  return (
    <div role="img" aria-label={summary} className="tnum relative h-9">
      <div className="absolute inset-x-0 top-[13px] h-0.5 bg-rule-2" />
      <div
        className="absolute top-[9px] h-2.5 rounded-[2px] bg-accent-2"
        style={{ left: `${layout.p25}%`, width: `${layout.p75 - layout.p25}%` }}
      />
      <div
        className="absolute top-[5px] h-[18px] w-0.5 bg-ink"
        style={{ left: `${layout.median}%` }}
      />
      {markers.map((m, i) => (
        <div
          key={m.kind}
          className={
            m.kind === 'current'
              ? 'absolute top-[7px] -ml-[7px] size-3.5 rounded-full bg-accent ring-3 ring-paper'
              : 'absolute top-[7px] -ml-[7px] size-3.5 rounded-full border-2 border-accent bg-paper'
          }
          style={{ left: `${layout.values[i]}%` }}
        />
      ))}
      {showLabels &&
        [band.p25, band.p75].map((v, i) => (
          // p25 hangs left of its mark and p75 right of its, so close marks never overlap labels.
          <span
            key={i}
            className={`absolute top-6 text-xs whitespace-nowrap text-muted ${i ? '' : '-translate-x-full'}`}
            style={{ left: `${i ? layout.p75 : layout.p25}%` }}
          >
            {money(v, countryCode)}
          </span>
        ))}
    </div>
  );
}
