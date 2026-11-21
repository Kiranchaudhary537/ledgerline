import type { Employee } from '@acme/shared';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { money } from '@/lib/format';
import {
  useChangeSalary,
  useCreateEmployee,
  useDeleteEmployee,
  useReloadEmployee,
  useUpdateEmployee,
} from '@/features/employees/forms/api/employee-mutations';
import { handleSaveError, type SaveErrorHandlers } from '@/features/employees/forms/api/save-error';
import { useBand } from '@/features/employees/shared/api/band';
import { useFilterOptions } from '@/features/employees/shared/api/filter-options';
import { DeleteDialog } from './components/DeleteDialog';
import { EmployeeForm } from './components/EmployeeForm';
import { SalaryChangeForm } from './components/SalaryChangeForm';

export type DialogKind = 'create' | 'edit' | 'salary' | 'delete';

interface Props {
  /** Which dialog is open; null for none. `employee` is required for everything but `create`. */
  kind: DialogKind | null;
  employee?: Employee | undefined;
  onClose: () => void;
}

/** Wires the three employee dialogs to their mutations, so every screen opens them the same way. */
export function EmployeeDialogs({ kind, employee, onClose }: Props) {
  const onOpenChange = (open: boolean) => !open && onClose();
  return (
    <>
      <FormDialog kind={kind} employee={employee} onClose={onClose} />
      {employee && (
        <>
          <SalaryDialog employee={employee} open={kind === 'salary'} onClose={onClose} />
          <DeleteEmployeeDialog
            employee={employee}
            open={kind === 'delete'}
            onOpenChange={onOpenChange}
          />
        </>
      )}
    </>
  );
}

function FormDialog({ kind, employee, onClose }: Props) {
  const creating = kind === 'create';
  const open = creating || (kind === 'edit' && !!employee);
  const options = useFilterOptions().data;
  const create = useCreateEmployee();
  const update = useUpdateEmployee(employee?.id ?? 0);
  const reload = useReloadEmployee();
  const save = creating ? create : update;

  const onSave = (body: unknown, handlers: SaveErrorHandlers) =>
    save.mutate(body, {
      onSuccess: onClose,
      onError: (error) => handleSaveError(error, handlers),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        side
        title={creating ? 'Add employee' : 'Edit details'}
        description={
          creating
            ? 'Enter the details and starting salary.'
            : 'Salary is changed separately, so it is kept in the history.'
        }
      >
        {/* The selects need their options before the form mounts, or an edited value would be lost. */}
        {options ? (
          <EmployeeForm
            mode={creating ? 'create' : 'edit'}
            employee={employee}
            options={options}
            pending={save.isPending}
            onSave={onSave}
            onReload={() => reload(employee?.id ?? 0)}
          />
        ) : (
          <p>Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SalaryDialog({
  employee,
  open,
  onClose,
}: {
  employee: Employee;
  open: boolean;
  onClose: () => void;
}) {
  const band = useBand(open ? employee : undefined).data;
  const change = useChangeSalary(employee.id);
  const reload = useReloadEmployee();
  const onSave = (body: unknown, handlers: SaveErrorHandlers) =>
    change.mutate(body, {
      onSuccess: onClose,
      onError: (error) => handleSaveError(error, handlers),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        title="Change salary"
        description={`${employee.fullName} earns ${money(employee.salaryMinor, employee.countryCode)} a year.`}
      >
        <SalaryChangeForm
          employee={employee}
          band={band}
          pending={change.isPending}
          onSave={onSave}
          onReload={() => reload(employee.id)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteEmployeeDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useDeleteEmployee(employee.id);
  return (
    <DeleteDialog
      employee={employee}
      open={open}
      pending={remove.isPending}
      onOpenChange={onOpenChange}
      onConfirm={() =>
        remove.mutate(undefined, {
          onError: (error) =>
            handleSaveError(error, { onFieldError: () => false, onStale: () => undefined }),
        })
      }
    />
  );
}
