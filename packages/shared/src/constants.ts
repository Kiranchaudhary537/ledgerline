import { countries } from 'countries-list';

/** ISO 3166-1 alpha-2 code, e.g. "IN". Validated against COUNTRY_CODES at the edges. */
export type CountryCode = string;

export interface Country {
  code: CountryCode;
  name: string;
  currency: string;
  /** Money is formatted as `en-<CC>`, e.g. en-IN gives ₹38,00,000. */
  locale: string;
  minorUnit: number;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function buildCountry(code: string, packageName: string, currency: string): Country | null {
  try {
    const locale = `en-${code}`;
    const { maximumFractionDigits } = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions();
    return {
      code,
      name: regionNames.of(code) ?? packageName,
      currency,
      locale,
      minorUnit: maximumFractionDigits ?? 2,
    };
  } catch {
    return null; // currency Intl does not know
  }
}

// Countries with no currency (Antarctica) are skipped. Several currencies: the first is used.
const BY_CODE = new Map<CountryCode, Country>();
for (const [code, { name, currency }] of Object.entries(countries)) {
  const c = currency[0] && buildCountry(code, name, currency[0]);
  if (c) BY_CODE.set(code, c);
}

export const COUNTRIES: readonly Country[] = [...BY_CODE.values()];
export const COUNTRY_CODES = [...BY_CODE.keys()] as [CountryCode, ...CountryCode[]];

export function getCountry(code: CountryCode): Country {
  const country = BY_CODE.get(code);
  if (!country) throw new Error(`Unknown country code: ${code}`);
  return country;
}

// Code, not a package or table: the level order drives sorting and pay bands.
/** Ordered from most junior to most senior. */
export const LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;
export type Level = (typeof LEVELS)[number];

// Code, not a package or table: employment types drive pay factors and compa-ratio bands.
export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

// Code, not a package or table: the gender-gap maths needs exactly these values.
export const GENDERS = ['female', 'male'] as const;
export type Gender = (typeof GENDERS)[number];
