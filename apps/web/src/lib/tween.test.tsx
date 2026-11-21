import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { easeOut, tween, useTween } from './tween';

afterEach(() => vi.unstubAllGlobals());

describe('tween', () => {
  test('starts at from, ends at to, and clamps outside 0..1', () => {
    expect(tween(10, 20, 0)).toBe(10);
    expect(tween(10, 20, 1)).toBe(20);
    expect(tween(10, 20, 5)).toBe(20);
    expect(tween(10, 20, -1)).toBe(10);
  });

  test('eases out: more than half way at half time', () => {
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe('useTween', () => {
  test('under reduced motion the new value is shown at once', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    const { result, rerender } = renderHook(({ v }) => useTween(v, 300), {
      initialProps: { v: 100 },
    });
    rerender({ v: 200 });
    expect(result.current).toBe(200);
    expect(raf).not.toHaveBeenCalled();
  });

  test('otherwise it glides: the first frame is not yet the target', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    const { result, rerender } = renderHook(({ v }) => useTween(v, 300), {
      initialProps: { v: 100 },
    });
    rerender({ v: 200 });
    act(() => frames.shift()?.(60));
    expect(result.current).toBeGreaterThan(100);
    expect(result.current).toBeLessThan(200);
    act(() => frames.shift()?.(400));
    expect(result.current).toBe(200);
    now.mockRestore();
  });
});
