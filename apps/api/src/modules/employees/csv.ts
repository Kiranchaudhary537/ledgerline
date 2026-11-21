import { type CountryCode, getCountry } from '@acme/shared';

/** RFC 4180 quoting plus a leading `'` so spreadsheets do not run values as formulas. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export const csvRow = (cells: string[]) => cells.map(csvCell).join(',') + '\r\n';

/** Minor units to a plain major-unit decimal string, using string math (no floats). */
export function formatMajor(minor: number, countryCode: CountryCode): string {
  const { minorUnit } = getCountry(countryCode);
  const digits = String(minor).padStart(minorUnit + 1, '0');
  return minorUnit === 0 ? digits : `${digits.slice(0, -minorUnit)}.${digits.slice(-minorUnit)}`;
}
