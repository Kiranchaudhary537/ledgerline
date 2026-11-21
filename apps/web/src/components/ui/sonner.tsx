import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      style={
        {
          '--normal-bg': 'var(--color-popover)',
          '--normal-text': 'var(--color-popover-foreground)',
          '--normal-border': 'var(--color-input)',
          '--border-radius': '0',
          fontFamily: 'var(--font-sans)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
