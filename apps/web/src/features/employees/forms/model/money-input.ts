import { parseMoney } from '@/lib/format';

export const AMOUNT_HINT = 'Enter an amount such as 19,50,000';

/** Typed major units → integer minor units, or null when the text is not an amount for that country. */
export const parseAmount = (input: string, countryCode: string) => parseMoney(input, countryCode);

export type Built = { ok: true; body: unknown } | { ok: false; errors: Record<string, string> };
