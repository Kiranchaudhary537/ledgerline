import { describe, expect, it } from 'vitest';
import { formatMoney, parseMajor } from './money.ts';

describe('parseMajor', () => {
  it('converts major units to minor units for 2-decimal currencies', () => {
    expect(parseMajor('3800000', 'IN')).toBe(380_000_000);
    expect(parseMajor('85000.5', 'DE')).toBe(8_500_050);
    expect(parseMajor('85000.55', 'DE')).toBe(8_500_055);
  });

  it('accepts comma and space grouping, including Indian grouping', () => {
    expect(parseMajor('38,00,000', 'IN')).toBe(380_000_000);
    expect(parseMajor('120 000', 'US')).toBe(12_000_000);
    expect(parseMajor('  85000  ', 'DE')).toBe(8_500_000);
  });

  it('treats JPY as a currency with no minor unit', () => {
    expect(parseMajor('5000000', 'JP')).toBe(5_000_000);
    expect(parseMajor('5000000.5', 'JP')).toBeNull();
  });

  it('rejects more decimals than the currency allows', () => {
    expect(parseMajor('85000.555', 'DE')).toBeNull();
  });

  it('rejects input that is not a plain positive amount', () => {
    for (const bad of ['', 'abc', '-100', '1e5', '12..3', '.5', '1,', '0x10']) {
      expect(parseMajor(bad, 'US'), bad).toBeNull();
    }
  });

  it('rejects amounts beyond safe integer range', () => {
    expect(parseMajor('99999999999999999', 'US')).toBeNull();
  });

  it('does not suffer floating point errors', () => {
    // 0.29 * 100 === 28.999999999999996 in floating point
    expect(parseMajor('0.29', 'US')).toBe(29);
  });
});

describe('formatMoney', () => {
  it('formats in the country locale and currency, without trailing zeros', () => {
    expect(formatMoney(380_000_000, 'IN')).toBe('₹38,00,000');
    expect(formatMoney(12_000_000, 'US')).toBe('$120,000');
    expect(formatMoney(5_000_000, 'JP')).toBe('￥5,000,000');
  });

  it('keeps minor units when present', () => {
    expect(formatMoney(8_500_050, 'DE')).toBe('85.000,50 €');
  });
});
