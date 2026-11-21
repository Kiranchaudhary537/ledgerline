import { useId, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

/** One insight on its own white card: a title, an optional one-line explanation, then the content. */
export function InsightCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Card role="region" aria-labelledby={titleId} className="overflow-hidden">
      <CardHeader className="items-start pb-3">
        <div className="space-y-1">
          <CardTitle id={titleId}>{title}</CardTitle>
          {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}
