import { CircleCheck } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** Static class names so Tailwind can see them; index = position on the cobalt ramp (light to dark). */
const RAMP = ['bg-ramp-1', 'bg-ramp-2', 'bg-ramp-3', 'bg-ramp-4', 'bg-ramp-5'] as const;
export const rampColor = (step: number) => RAMP[Math.min(Math.max(step, 0), RAMP.length - 1)];

/** A legend swatch: it names one step of the ramp, so it always sits beside its label. */
export function Swatch({ step, className }: { step: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 rounded-[2px]', rampColor(step), className)}
    />
  );
}

/** Cut chip for a category (department, level, reason): text on a paper-2 well, no colour of its own. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="cut-s inline-flex items-center bg-paper-2 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-ink-2">
      {children}
    </span>
  );
}

/** Status is text with one icon, never a filled chip. */
export function Status({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
      <CircleCheck aria-hidden className="size-4" />
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'cut-s inline-flex shrink-0 items-center justify-center bg-paper-3 font-medium text-ink-2 select-none',
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-14 font-display text-lg',
        className,
      )}
    >
      {initials}
    </span>
  );
}
