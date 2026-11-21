import { formatMoney, parseMajor } from '@acme/shared';

type Country = Parameters<typeof formatMoney>[1];

// Country codes arrive from the API as plain strings; the shared money helpers decide what is valid.
export const money = (minor: number, countryCode: string) =>
  formatMoney(minor, countryCode as Country);

export const parseMoney = (input: string, countryCode: string) =>
  parseMajor(input, countryCode as Country);

/** "full_time" → "Full time", "senior" → "Senior". */
export function label(value: string) {
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

/** Accepts YYYY-MM-DD or a full ISO timestamp; shows the calendar date in UTC. */
export const formatDate = (iso: string) =>
  dateFormat.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));

const percent = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
export const formatPercent = (fraction: number) => percent.format(fraction);

export const formatCount = new Intl.NumberFormat().format;
