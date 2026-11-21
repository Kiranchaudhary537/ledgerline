const monthYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** "Joined Oct 2015, 11 years"; under a year it counts months, under a month it says so. */
export function tenureText(hireDate: string, now: Date) {
  const hired = new Date(`${hireDate}T00:00:00Z`);
  const months =
    (now.getUTCFullYear() - hired.getUTCFullYear()) * 12 +
    now.getUTCMonth() -
    hired.getUTCMonth() -
    (now.getUTCDate() < hired.getUTCDate() ? 1 : 0);
  const span =
    months >= 12
      ? plural(Math.floor(months / 12), 'year')
      : months >= 1
        ? plural(months, 'month')
        : 'less than a month';
  return `Joined ${monthYear.format(hired)}, ${span}`;
}
