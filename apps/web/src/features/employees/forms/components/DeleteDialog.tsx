import type { Employee } from '@acme/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';

export function DeleteDialog({
  employee,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  employee: Employee;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Delete ${employee.fullName}?`}
        description="They will no longer appear in the list or in insights. Their salary history is kept."
      >
        <div className="flex gap-2">
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? 'Deleting…' : 'Delete employee'}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
