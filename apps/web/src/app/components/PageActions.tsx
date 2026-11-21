import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The site header's action slot; null until the shell has mounted it. */
export const PageActionsSlot = createContext<HTMLElement | null>(null);

/** Renders its children into the site header, so each page owns its actions but the shell owns the place. */
export function PageActions({ children }: { children: ReactNode }) {
  const slot = useContext(PageActionsSlot);
  return slot ? createPortal(children, slot) : null;
}
