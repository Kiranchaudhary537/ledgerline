import { type CountryCode, getCountry } from './constants.ts';

// Digits with optional comma/space grouping, optional "." decimals. No sign, no exponent.
const AMOUNT = /^\d+(?:[, ]\d+)*(?:\.(\d+))?$/;

/**
 * Parses a major-unit amount typed by a user ("38,00,000", "85000.50") into integer minor units.
 * Uses string math only, so there are no floating point errors. Returns null when invalid.
 */
export function parseMajor(input: string, countryCode: CountryCode): number | null {
  const text = input.trim();
  const match = AMOUNT.exec(text);
  if (!match) return null;

  const { minorUnit } = getCountry(countryCode);
  const [whole = '', fraction = ''] = text.replace(/[, ]/g, '').split('.');
  if (fraction.length > minorUnit) return null;

  const minor = Number(whole + fraction.padEnd(minorUnit, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

const formatters = new Map<CountryCode, Intl.NumberFormat>();

/** Formats integer minor units in the country's locale and currency, e.g. ₹38,00,000. */
export function formatMoney(minor: number, countryCode: CountryCode): string {
  const { locale, currency, minorUnit } = getCountry(countryCode);
  let formatter = formatters.get(countryCode);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      trailingZeroDisplay: 'stripIfInteger',
    });
    formatters.set(countryCode, formatter);
  }
  return formatter.format(minor / 10 ** minorUnit);
}
