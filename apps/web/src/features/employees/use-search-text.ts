import { config } from '@acme/shared';
import { useEffect, useRef, useState } from 'react';

/** Search box text, committed to the URL after a pause; follows the URL when it changes elsewhere. */
export function useSearchText(q: string, commit: (q: string) => void) {
  const [text, setText] = useState(q);
  const pushed = useRef(q);

  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q;
      setText(q);
    }
  }, [q]);

  useEffect(() => {
    const value = text.trim();
    if (value === pushed.current || (value.length > 0 && value.length < config.search.minLength))
      return;
    const timer = setTimeout(() => {
      pushed.current = value;
      commit(value);
    }, config.ui.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [text]);

  return [text, setText] as const;
}
