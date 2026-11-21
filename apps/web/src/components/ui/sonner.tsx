import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      style={
        {
          '--normal-bg': 'var(--color-paper)',
          '--normal-text': 'var(--color-ink)',
          '--normal-border': 'var(--color-rule-2)',
          '--border-radius': 'var(--radius-card)',
          fontFamily: 'var(--font-body)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
