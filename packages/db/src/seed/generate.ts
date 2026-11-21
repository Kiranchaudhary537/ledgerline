import {
  config,
  type CountryCode,
  type EmployeeCreate,
  type EmploymentType,
  type Gender,
  getCountry,
  type Level,
} from '@acme/shared';
import {
  ALLOWED_LEVELS,
  BASE_PAY,
  COUNTRY_WEIGHTS,
  DEPARTMENT_WEIGHTS,
  EMPLOYMENT_FACTOR,
  EMPLOYMENT_WEIGHTS,
  FEMALE_PAY_FACTOR,
  FEMALE_SHARE,
  LEVEL_FACTOR,
  LEVEL_WEIGHTS,
  NAMES,
  ROUNDING,
  TENURE_YEARS,
  TITLE_FACTOR,
  TITLE_WEIGHTS,
  type Weighted,
} from './data.ts';

/** Looks up a seed table by key; the tables are keyed by plain strings, so a miss is a data bug. */
function at<T>(table: Record<string, T>, key: string): T {
  const value = table[key];
  if (value === undefined) throw new Error(`Seed data has no entry for ${key}`);
  return value;
}

const seedConfig = config.seed;
const DAY_MS = 86_400_000;

export interface SeedSalaryChange {
  oldSalaryMinor: number | null;
  newSalaryMinor: number;
  reason: string;
  /** YYYY-MM-DD */
  changedAt: string;
}

export type SeedEmployee = EmployeeCreate & { history: SeedSalaryChange[] };

function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (min: number, max: number) => min + next() * (max - min),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    weighted<T>(items: Weighted<T>): T {
      const total = items.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of items) {
        roll -= weight;
        if (roll < 0) return value;
      }
      return items.at(-1)![0];
    },
  };
}

type BandInput = {
  countryCode: CountryCode;
  jobTitle: string;
  level: Level;
  department?: EmployeeCreate['department'];
  gender?: Gender;
  employmentType?: EmploymentType;
};

/** Salary band in minor units. Defaults: male, full time (no gap or part-time adjustment). */
export function salaryBand({
  countryCode,
  jobTitle,
  level,
  department,
  gender = 'male',
  employmentType = 'full_time',
}: BandInput): { min: number; max: number } {
  const genderFactor = gender === 'female' && department ? (FEMALE_PAY_FACTOR[department] ?? 1) : 1;
  const midMajor =
    at(BASE_PAY, countryCode) *
    at(TITLE_FACTOR, jobTitle) *
    at(LEVEL_FACTOR, level) *
    genderFactor *
    at(EMPLOYMENT_FACTOR, employmentType);
  const toMinor = 10 ** getCountry(countryCode).minorUnit;
  return {
    min: Math.ceil(midMajor * (1 - seedConfig.bandSpread) * toMinor),
    max: Math.floor(midMajor * (1 + seedConfig.bandSpread) * toMinor),
  };
}

function toAscii(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

export function generateEmployees({
  seed,
  count,
}: {
  seed: number;
  count: number;
}): SeedEmployee[] {
  const random = createRandom(seed);
  const emailsTaken = new Map<string, number>();
  const employees: SeedEmployee[] = [];

  for (let i = 0; i < count; i++) {
    const countryCode = random.weighted(COUNTRY_WEIGHTS);
    const department = random.weighted(DEPARTMENT_WEIGHTS);
    const jobTitle = random.weighted(at(TITLE_WEIGHTS, department));
    const allowed = ALLOWED_LEVELS[jobTitle];
    const level = allowed
      ? random.weighted(LEVEL_WEIGHTS.filter(([l]) => allowed.includes(l)))
      : random.weighted(LEVEL_WEIGHTS);
    const gender: Gender = random.next() < at(FEMALE_SHARE, department) ? 'female' : 'male';
    const employmentType = random.weighted(EMPLOYMENT_WEIGHTS);

    const names = at(NAMES, countryCode);
    const first = random.pick(names[gender]);
    const last = random.pick(names.last);
    const local = `${toAscii(first)}.${toAscii(last)}`;
    const seen = (emailsTaken.get(local) ?? 0) + 1;
    emailsTaken.set(local, seen);
    const email = `${local}${seen > 1 ? seen : ''}@acme.example`;

    const [minYears, maxYears] = TENURE_YEARS[level];
    const tenureDays = Math.round(random.between(minYears, maxYears) * 365);
    const hireDate = addDays(seedConfig.referenceDate, -tenureDays);

    const step = at(ROUNDING, countryCode) * 10 ** getCountry(countryCode).minorUnit;
    const band = salaryBand({ countryCode, jobTitle, level, department, gender, employmentType });
    // Average of two uniforms: most salaries near the middle of the band, few at the edges.
    const raw = band.min + ((random.next() + random.next()) / 2) * (band.max - band.min);
    const salaryMinor = Math.min(
      Math.max(Math.round(raw / step) * step, Math.ceil(band.min / step) * step),
      Math.floor(band.max / step) * step,
    );

    const anniversaries = Math.floor(tenureDays / 365);
    const salaries = [salaryMinor];
    const reasons: string[] = [];
    for (let k = anniversaries; k >= 1; k--) {
      const promotion = random.next() < seedConfig.promotionChance;
      const raise = promotion
        ? random.between(...seedConfig.promotionRaise)
        : random.between(...seedConfig.annualRaise);
      const later = salaries[0]!;
      const earlier = Math.min(Math.round(later / (1 + raise) / step) * step, later - step);
      salaries.unshift(Math.max(earlier, step));
      reasons.unshift(promotion ? 'Promotion' : 'Annual review');
    }
    const history: SeedSalaryChange[] = salaries.map((newSalaryMinor, k) => ({
      oldSalaryMinor: k === 0 ? null : salaries[k - 1]!,
      newSalaryMinor,
      reason: k === 0 ? 'Starting salary' : reasons[k - 1]!,
      changedAt: addDays(hireDate, k * 365),
    }));

    employees.push({
      fullName: `${first} ${last}`,
      email,
      department,
      jobTitle,
      level,
      countryCode,
      employmentType,
      gender,
      hireDate,
      salaryMinor,
      history,
    });
  }
  return employees;
}
