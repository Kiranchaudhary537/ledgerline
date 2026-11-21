import { useEffect, useRef, useState } from 'react';

/** A duration token from tokens.css (e.g. '--dur-long') in ms, so script and CSS motion share one source. */
export function motionMs(token: string, fallback = 320) {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return raw.endsWith('ms') ? Number.parseFloat(raw) : fallback;
}

/** Ease-out cubic: fast start, slow landing, like the CSS --ease-out token. */
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The value `t` (0..1) of the way from `from` to `to`, eased. */
export const tween = (from: number, to: number, t: number) =>
  from + (to - from) * easeOut(Math.min(1, Math.max(0, t)));

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that glides to `target` when it changes, so a changed figure shows where it came from.
 * Under reduced motion it is `target` at once. The first value is shown as is.
 */
export function useTween(target: number, durationMs = motionMs('--dur-long')) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion() || durationMs <= 0) {
      from.current = target;
      setShown(target);
      return;
    }
    if (from.current === target) return;
    const start = from.current;
    const t0 = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = (now - t0) / durationMs;
      from.current = tween(start, target, t);
      setShown(from.current);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}
