import { describe, expect, it } from 'vitest';
import { csvCell, csvRow, formatMajor } from './csv.ts';

describe('csvCell', () => {
  it('leaves plain values alone', () => {
    expect(csvCell('Priya Sharma')).toBe('Priya Sharma');
  });
  it('quotes commas, quotes and newlines, doubling quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });
  it('neutralises formula injection', () => {
    for (const v of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx']) {
      expect(csvCell(v)).toBe(`'${v}`);
    }
    expect(csvCell('\rx')).toBe('"\'\rx"');
  });
  it('escapes after neutralising', () => {
    expect(csvCell('=a,b')).toBe('"\'=a,b"');
  });
});

describe('csvRow', () => {
  it('joins with commas and ends with CRLF', () => {
    expect(csvRow(['a', 'b,c'])).toBe('a,"b,c"\r\n');
  });
});

describe('formatMajor', () => {
  it('formats two-decimal currencies', () => {
    expect(formatMajor(380000000, 'IN')).toBe('3800000.00');
    expect(formatMajor(5, 'US')).toBe('0.05');
  });
  it('formats JPY without decimals', () => {
    expect(formatMajor(3800000, 'JP')).toBe('3800000');
  });
});
