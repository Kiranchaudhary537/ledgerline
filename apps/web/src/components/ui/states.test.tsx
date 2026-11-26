import { config } from '@acme/shared';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WakingHint } from './states';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('waking hint', () => {
  test('says the server is waking once a request has been pending for a while', () => {
    render(<WakingHint pending />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(config.ui.slowRequestMs));
    expect(screen.getByRole('status')).toHaveTextContent(/waking the server/i);
  });

  test('stays hidden when nothing is pending', () => {
    render(<WakingHint pending={false} />);
    act(() => vi.advanceTimersByTime(config.ui.slowRequestMs * 2));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('hides again when the request finishes', () => {
    const { rerender } = render(<WakingHint pending />);
    act(() => vi.advanceTimersByTime(config.ui.slowRequestMs));
    rerender(<WakingHint pending={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
