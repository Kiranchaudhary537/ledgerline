import type { Employee } from '@acme/shared';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, label } from '@/lib/format';

export function ProfileCard({
  employee: e,
  countryName,
  onEdit,
}: {
  employee: Employee;
  countryName: string;
  onEdit: () => void;
}) {
  const facts: [string, string][] = [
    ['Full name', e.fullName],
    ['Email', e.email],
    ['Department', e.department],
    ['Job title', e.jobTitle],
    ['Level', label(e.level)],
    ['Employment type', label(e.employmentType)],
    ['Gender', label(e.gender)],
    ['Country', countryName],
    ['Employee code', e.employeeCode],
    ['Hire date', formatDate(e.hireDate)],
  ];
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Profile</CardTitle>
        <Button variant="secondary" onClick={onEdit}>
          Edit details
        </Button>
      </CardHeader>
      <dl className="grid gap-x-10 gap-y-4 border-t border-rule p-5 sm:grid-cols-2">
        {facts.map(([term, value]) => (
          <div key={term} className="min-w-0">
            <dt className="text-xs text-muted">{term}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
