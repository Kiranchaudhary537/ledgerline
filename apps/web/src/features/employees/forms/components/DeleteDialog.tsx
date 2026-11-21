import type { Employee } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { handleSaveError } from '@/features/employees/forms/components/form-parts';
import { employeesKey } from '@/features/employees/shared/api/employee';

export function DeleteDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const remove = useMutation({
    mutationFn: () => api(`/api/employees/${employee.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      // Leave the page first, so nothing on it refetches the deleted employee.
      await navigate('/employees');
      queryClient.removeQueries({
        queryKey: employeesKey,
        predicate: (q) => q.queryKey[1] !== 'list',
      });
      void queryClient.invalidateQueries({ queryKey: employeesKey });
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Employee deleted');
    },
    onError: (error) =>
      handleSaveError(
        error,
        () => false,
        () => undefined,
      ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Delete ${employee.fullName}?`}
        description="They will no longer appear in the list or in insights. Their salary history is kept."
      >
        <div className="flex gap-2">
          <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>
            {remove.isPending ? 'Deleting…' : 'Delete employee'}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
