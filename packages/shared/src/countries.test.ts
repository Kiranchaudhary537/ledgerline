import { describe, expect, it } from 'vitest';
import { COUNTRIES, COUNTRY_CODES, getCountry } from './constants.ts';

describe('countries', () => {
  it('covers all ISO countries that have a currency', () => {
    expect(COUNTRIES.length).toBeGreaterThan(240);
    expect(COUNTRY_CODES).toHaveLength(COUNTRIES.length);
    expect(COUNTRY_CODES).not.toContain('AQ');
  });

  it('gives currency, name, locale and minor unit', () => {
    expect(getCountry('IN')).toEqual({
      code: 'IN',
      name: 'India',
      currency: 'INR',
      locale: 'en-IN',
      minorUnit: 2,
    });
    expect(getCountry('DE')).toMatchObject({ currency: 'EUR', locale: 'en-DE', minorUnit: 2 });
    expect(getCountry('JP')).toMatchObject({ currency: 'JPY', minorUnit: 0 });
    expect(getCountry('KW')).toMatchObject({ currency: 'KWD', minorUnit: 3 });
  });

  it('keeps minor units within what the database allows', () => {
    expect(COUNTRIES.every((c) => c.minorUnit >= 0 && c.minorUnit <= 3)).toBe(true);
  });

  it('returns the same object each time and throws on unknown codes', () => {
    expect(getCountry('US')).toBe(getCountry('US'));
    expect(() => getCountry('XX')).toThrow('Unknown country code');
  });
});
