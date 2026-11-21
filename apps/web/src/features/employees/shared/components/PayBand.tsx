import type * as React from 'react';
import { money } from '@/lib/format';
import {
  bandLayout,
  labelsThatFit,
  type Band,
  type BandScale,
} from '@/features/employees/shared/model/band-geometry';
import { cn } from '@/lib/utils';

export interface BandPoint {
  value: number;
  /** current = the person, solid; proposed = the change being previewed, outlined. */
  kind: 'current' | 'proposed';
}

export type PayBandSize = 'large' | 'compact' | 'preview';

/** Pixel layout per size: track offset from the top, track height, point edge. Fixed so rows line up. */
const SIZE = {
  large: { height: 92, top: 28, track: 24, point: 12 },
  preview: { height: 92, top: 24, track: 20, point: 12 },
  compact: { height: 24, top: 0, track: 24, point: 10 },
} as const;

/**
 * Everything in a layer sits at `pos` percent along the band; the slide is a transform, so it is cheap.
 * `from` is where a newly shown point starts: the proposed point leaves from the current one.
 */
function Layer({
  pos,
  from = 0,
  children,
}: {
  pos: number;
  from?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="point-slide absolute inset-y-0 left-0 w-full"
      style={{ transform: `translateX(${pos}%)`, '--from': `${from}%` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

const centred = 'absolute left-0 -translate-x-1/2 whitespace-nowrap';

/**
 * The pay band: the range min to max, the middle half (p25 to p75) shaded, the median as a tick, and
 * the person (and, in the change form, the proposed salary) as labelled points. See docs/ui-design.md.
 */
export function PayBand({
  band,
  countryCode,
  points = [],
  size = 'large',
  scale,
}: {
  band: Band;
  countryCode: string;
  points?: BandPoint[];
  size?: PayBandSize;
  /** Shared scale for bands that are compared side by side. */
  scale?: BandScale;
}) {
  const s = SIZE[size];
  const layout = bandLayout(band, [band.min, band.max, ...points.map((p) => p.value)], scale);
  const [lo = 0, hi = 100, ...at] = layout.values;
  const labelled = size !== 'compact';
  const ticks = [
    { at: lo, text: money(band.min, countryCode) },
    ...(size === 'large'
      ? [{ at: layout.median, text: `median ${money(band.median, countryCode)}` }]
      : []),
    { at: hi, text: money(band.max, countryCode) },
  ];
  // A tick that sits on a point's own label, or on its neighbour, is dropped: the point says it already.
  const free = ticks.filter((t) => !at.some((a) => Math.abs(a - t.at) < 6));
  const axis = labelsThatFit(free.map((t) => t.at)).map((i) => free[i]!);
  const summary =
    `Pay band: ${money(band.min, countryCode)} to ${money(band.max, countryCode)}, middle half ` +
    `${money(band.p25, countryCode)} to ${money(band.p75, countryCode)}, median ${money(band.median, countryCode)}` +
    points
      .map((p) => `, ${p.kind === 'current' ? 'current' : 'new'} ${money(p.value, countryCode)}`)
      .join('');

  return (
    <div
      role="img"
      aria-label={summary}
      className={cn('tnum relative w-full', size === 'compact' ? 'px-1' : 'px-12')}
      style={{ height: s.height }}
    >
      <div className="relative h-full">
        <div className="absolute inset-x-0" style={{ top: s.top, height: s.track }}>
          <div
            className="absolute inset-y-0 bg-muted-foreground/25"
            style={{ left: `${lo}%`, width: `${hi - lo}%`, top: '45%', height: 2 }}
          />
          <div
            className="absolute inset-y-[15%] bg-band-soft"
            style={{ left: `${layout.p25}%`, width: `${layout.p75 - layout.p25}%` }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-band" style={{ left: `${layout.median}%` }} />
          {points.map((p, i) => (
            <Layer key={p.kind} pos={at[i] ?? 0} from={p.kind === 'proposed' ? (at[0] ?? 0) : 0}>
              <div
                className={cn(
                  centred,
                  'bg-primary',
                  p.kind === 'proposed' && 'border-2 border-primary bg-card',
                )}
                style={{ width: s.point, height: s.point, top: (s.track - s.point) / 2 }}
              />
              {labelled && (
                <span
                  className={cn(
                    centred,
                    'text-sm font-semibold text-primary',
                    p.kind === 'current' || size === 'large'
                      ? 'bottom-full mb-1.5'
                      : 'top-full mt-1.5',
                  )}
                >
                  {money(p.value, countryCode)}
                </span>
              )}
            </Layer>
          ))}
        </div>
        {labelled && (
          <div className="absolute inset-x-0 text-xs text-muted-foreground" style={{ bottom: 6 }}>
            {axis.map((t) => (
              <span
                key={t.text}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${t.at}%` }}
              >
                {t.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
