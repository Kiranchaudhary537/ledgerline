import { toneDot } from '@/components/ui/pill';
import { cn } from '@/lib/utils';

export interface Segment {
  key: string;
  /** Share of the bar, 0..100. */
  pct: number;
  /** Category colour index. */
  tone: number;
}

/**
 * Thin multi-segment bar for the bottom edge of a card, with an optional marker.
 * Decorative: the same numbers are always shown as text next to it.
 */
export function SegmentBar({
  segments,
  marker,
  edge = false,
  className,
}: {
  segments: Segment[];
  /** 0..100 along the bar. */
  marker?: number | undefined;
  /** Round the outer ends to the card's bottom corners. */
  edge?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('relative flex h-1.5 w-full gap-0.5', className)}>
      {segments.map((s) => (
        <div
          key={s.key}
          className={cn(
            'h-full min-w-1',
            toneDot(s.tone),
            edge && 'first:rounded-bl-xl last:rounded-br-xl',
          )}
          style={{ width: `${s.pct}%` }}
        />
      ))}
      {marker !== undefined && (
        <div
          className="absolute bottom-0 h-4 w-1 -translate-x-1/2 rounded-sm bg-foreground ring-2 ring-card"
          style={{ left: `${marker}%` }}
        />
      )}
    </div>
  );
}
