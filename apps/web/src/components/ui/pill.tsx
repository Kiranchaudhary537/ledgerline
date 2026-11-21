import type * as React from 'react';
import { TONE_COUNT } from '@/lib/tone';
import { cn } from '@/lib/utils';

/** Static class names so Tailwind can see them; index = tone from `toneOf`. */
const DOT = ['bg-cat-1', 'bg-cat-2', 'bg-cat-3', 'bg-cat-4', 'bg-cat-5', 'bg-cat-6'] as const;
const TINT = [
  'bg-cat-1/20',
  'bg-cat-2/20',
  'bg-cat-3/20',
  'bg-cat-4/20',
  'bg-cat-5/20',
  'bg-cat-6/20',
] as const;

const toneIndex = (tone: number) => ((tone % TONE_COUNT) + TONE_COUNT) % TONE_COUNT;
export const toneDot = (tone: number) => DOT[toneIndex(tone)];

export function Dot({ tone, className }: { tone: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 rounded-full', toneDot(tone), className)}
    />
  );
}

const pillBase =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

/** Neutral pill with a coloured dot: category (department, level, reason). */
export function DotPill({ tone, children }: { tone: number; children: React.ReactNode }) {
  return (
    <span className={cn(pillBase, 'border border-border bg-muted text-foreground')}>
      <Dot tone={tone} />
      {children}
    </span>
  );
}

/** Green status pill ("Active"). */
export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn(pillBase, 'bg-success-soft text-success')}>
      <span aria-hidden className="size-1.5 rounded-full bg-success" />
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  tone,
  size = 'md',
  className,
}: {
  initials: string;
  tone: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-foreground select-none',
        TINT[toneIndex(tone)],
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-14 text-lg',
        className,
      )}
    >
      {initials}
    </span>
  );
}
