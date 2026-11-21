import { rampColor } from '@/components/ui/pill';
import { cn } from '@/lib/utils';

export interface Segment {
  key: string;
  /** Share of the bar, 0..100. */
  pct: number;
  /** Step on the cobalt ramp, 0 (light) to 4 (dark). */
  step: number;
}

/**
 * The pay band as a bar on the bottom edge of a panel: four ramp steps and an optional tick.
 * The same numbers are always written beside it.
 */
export function SegmentBar({
  segments,
  marker,
  className,
}: {
  segments: Segment[];
  /** 0..100 along the bar. */
  marker?: number | undefined;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('relative flex h-1.5 w-full gap-0.5', className)}>
      {segments.map((s) => (
        <div
          key={s.key}
          className={cn('h-full min-w-1', rampColor(s.step))}
          style={{ width: `${s.pct}%` }}
        />
      ))}
      {marker !== undefined && (
        <div
          className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-ink ring-2 ring-paper"
          style={{ left: `clamp(2px, ${marker}%, calc(100% - 2px))` }}
        />
      )}
    </div>
  );
}
