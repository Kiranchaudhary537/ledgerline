import * as DialogPrimitive from '@radix-ui/react-dialog';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

/**
 * `side` makes it a right-hand sheet; otherwise a centred dialog. Radix traps focus and closes on Esc.
 * The dialog is centred with auto margins, not a translate, so the scale-in owns `transform`.
 */
function DialogContent({
  className,
  children,
  title,
  description,
  side = false,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, 'title'> & {
  title: string;
  description?: string;
  side?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="scrim fixed inset-0 z-40 bg-foreground/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 overflow-y-auto overscroll-contain border bg-card p-6 text-card-foreground',
          side
            ? 'sheet inset-y-0 right-0 w-full max-w-md'
            : 'pop inset-0 m-auto h-fit max-h-[90dvh] w-[calc(100%-2rem)] max-w-md',
          className,
        )}
        {...props}
      >
        <div className="space-y-1">
          <DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Dialog, DialogClose, DialogContent, DialogTrigger };
