import { Button } from '@/components/ui/button';

export function StaleBanner({ onReload }: { onReload: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-md border border-destructive p-3"
    >
      <p className="text-destructive">Someone else changed this employee.</p>
      <Button type="button" variant="secondary" size="sm" onClick={onReload}>
        Reload
      </Button>
    </div>
  );
}
