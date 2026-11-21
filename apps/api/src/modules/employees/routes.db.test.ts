import { EmployeeRepository } from '@acme/db';
import { createTestDb, resetDb } from '@acme/db/testing';
import { type EmployeeCreate, getCountry } from '@acme/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.ts';
import { loginCookie } from '../../testing.ts';
import { csvRow, formatMajor } from './csv.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const base: EmployeeCreate = {
  fullName: 'Priya Sharma',
  email: 'priya@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 380_000_000,
};

async function setup() {
  const app = buildApp({ db, logger: false });
  const cookie = await loginCookie(app, db);
  const headers = { cookie };
  const get = (url: string) => app.inject({ method: 'GET', url, headers });
  const send = (method: 'POST' | 'PATCH', url: string, payload: unknown) =>
    app.inject({ method, url, headers, payload: payload as object });
  const seed = async (over: Partial<EmployeeCreate> = {}) => {
    const user = await db.selectFrom('users').select('id').executeTakeFirstOrThrow();
    return new EmployeeRepository(db).create({ ...base, ...over }, user.id);
  };
  return { app, headers, get, send, seed };
}

describe('GET /api/employees', () => {
  it('filters, sorts and pages', async () => {
    const { app, get, seed } = await setup();
    await seed({ fullName: 'Anna', email: 'a@x.example', countryCode: 'DE', salaryMinor: 500 });
    await seed({ fullName: 'Bob', email: 'b@x.example', gender: 'male' });
    await seed({ fullName: 'Cara', email: 'c@x.example', gender: 'male' });
    const all = (await get('/api/employees')).json();
    expect(all).toMatchObject({ page: 1, pageSize: 25, total: 3 });
    expect(all.data.map((e: { fullName: string }) => e.fullName)).toEqual(['Anna', 'Bob', 'Cara']);
    expect(all.data[0]).toMatchObject({
      currency: 'EUR',
      countryCode: 'DE',
    });

    const filtered = (await get('/api/employees?country=IN&gender=male&sort=name:desc')).json();
    expect(filtered.data.map((e: { fullName: string }) => e.fullName)).toEqual(['Cara', 'Bob']);

    const paged = (await get('/api/employees?pageSize=2&page=2')).json();
    expect(paged).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(paged.data).toHaveLength(1);
    await app.close();
  });

  it('rejects salary sort without one country and pageSize over 100', async () => {
    const { app, get } = await setup();
    const sort = await get('/api/employees?sort=salary:asc');
    expect(sort.statusCode).toBe(400);
    expect(sort.json().fields.sort).toBeDefined();
    expect((await get('/api/employees?sort=salary:asc&country=IN')).statusCode).toBe(200);
    expect((await get('/api/employees?pageSize=101')).statusCode).toBe(400);
    await app.close();
  });
});

describe('GET /api/employees/:id', () => {
  it('returns the employee, 404 for missing, deleted or non-numeric ids', async () => {
    const { app, get, seed } = await setup();
    const e = await seed();
    const ok = await get(`/api/employees/${e.id}`);
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({
      id: e.id,
      currency: 'INR',
      hireDate: '2021-04-12',
    });
    expect((await get('/api/employees/99999')).statusCode).toBe(404);
    expect((await get('/api/employees/abc')).json().code).toBe('NOT_FOUND');
    expect((await get('/api/employees/-1')).statusCode).toBe(404);
    await app.close();
  });
});

describe('writes', () => {
  it('creates (201) and rejects a duplicate email with EMAIL_TAKEN', async () => {
    const { app, send } = await setup();
    const res = await send('POST', '/api/employees', base);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ fullName: 'Priya Sharma', version: 1 });
    const history = await db.selectFrom('salaryChanges').selectAll().execute();
    expect(history).toHaveLength(1);
    const dup = await send('POST', '/api/employees', base);
    expect(dup.statusCode).toBe(409);
    expect(dup.json()).toMatchObject({ code: 'EMAIL_TAKEN', fields: { email: 'Already in use' } });
    await app.close();
  });

  it('rejects a job title from another department, and an unknown country, on create', async () => {
    const { app, send } = await setup();
    const title = await send('POST', '/api/employees', { ...base, jobTitle: 'Recruiter' });
    expect(title.statusCode).toBe(400);
    expect(title.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      fields: { jobTitle: 'Choose a job title in this department' },
    });
    const country = await send('POST', '/api/employees', { ...base, countryCode: 'XX' });
    expect(country.statusCode).toBe(400);
    expect(country.json().fields.countryCode).toBe('Choose a country');
    await app.close();
  });

  it('rejects a country change, which would leave the salary in the wrong currency', async () => {
    const { app, send, seed } = await setup();
    const e = await seed();
    const res = await send('PATCH', `/api/employees/${e.id}`, { countryCode: 'DE', version: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.json().fields.countryCode).toBe(
      "Country can't be changed; add a new record for a relocation",
    );
    await app.close();
  });

  it('patches, bumps the version, and 409s when stale', async () => {
    const { app, send, seed } = await setup();
    const e = await seed();
    const ok = await send('PATCH', `/api/employees/${e.id}`, { level: 'lead', version: 1 });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ level: 'lead', version: 2 });
    const stale = await send('PATCH', `/api/employees/${e.id}`, { level: 'mid', version: 1 });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().code).toBe('STALE_VERSION');
    expect(
      (await send('PATCH', '/api/employees/9999', { level: 'mid', version: 1 })).statusCode,
    ).toBe(404);
    await app.close();
  });

  it('checks a lone department or jobTitle against the stored one', async () => {
    const { app, send, seed } = await setup();
    const e = await seed();
    const badTitle = await send('PATCH', `/api/employees/${e.id}`, {
      jobTitle: 'Recruiter',
      version: 1,
    });
    expect(badTitle.statusCode).toBe(400);
    expect(badTitle.json().fields.jobTitle).toBe('Choose a job title in this department');
    const badDept = await send('PATCH', `/api/employees/${e.id}`, {
      department: 'Finance',
      version: 1,
    });
    expect(badDept.json().fields.jobTitle).toBe('Choose a job title in this department');
    const ok = await send('PATCH', `/api/employees/${e.id}`, {
      jobTitle: 'QA Engineer',
      version: 1,
    });
    expect(ok.statusCode).toBe(200);
    await app.close();
  });

  it('deletes then 404s', async () => {
    const { app, headers, get, seed } = await setup();
    const e = await seed();
    const del = await app.inject({ method: 'DELETE', url: `/api/employees/${e.id}`, headers });
    expect(del.statusCode).toBe(204);
    expect((await get(`/api/employees/${e.id}`)).statusCode).toBe(404);
    const again = await app.inject({ method: 'DELETE', url: `/api/employees/${e.id}`, headers });
    expect(again.statusCode).toBe(404);
    await app.close();
  });
});

describe('salary changes', () => {
  it('changes salary, writes history (newest first, with changer name), 409 when stale', async () => {
    const { app, send, get, seed } = await setup();
    const e = await seed();
    const url = `/api/employees/${e.id}/salary-changes`;
    const ok = await send('POST', url, {
      newSalaryMinor: 400_000_000,
      reason: 'Promotion',
      version: 1,
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ salaryMinor: 400_000_000, version: 2 });
    const stale = await send('POST', url, { newSalaryMinor: 1, reason: 'Oops', version: 1 });
    expect(stale.statusCode).toBe(409);
    const hist = await get(`/api/employees/${e.id}/salary-history`);
    expect(hist.statusCode).toBe(200);
    expect(hist.json()).toMatchObject([
      {
        oldSalaryMinor: 380_000_000,
        newSalaryMinor: 400_000_000,
        reason: 'Promotion',
        changedByName: 'Hana HR',
      },
      { oldSalaryMinor: null, newSalaryMinor: 380_000_000, reason: 'Starting salary' },
    ]);
    expect((await get('/api/employees/9999/salary-history')).statusCode).toBe(404);
    expect(
      (
        await send('POST', '/api/employees/9999/salary-changes', {
          newSalaryMinor: 5,
          reason: 'abc',
          version: 1,
        })
      ).statusCode,
    ).toBe(404);
    await app.close();
  });

  it('rejects invalid input with fields', async () => {
    const { app, send, seed } = await setup();
    const e = await seed();
    const res = await send('POST', `/api/employees/${e.id}/salary-changes`, {
      newSalaryMinor: 0,
      reason: 'x',
      version: 1,
    });
    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.json().fields).sort()).toEqual(['newSalaryMinor', 'reason']);
    await app.close();
  });
});

describe('GET /api/employees/export.csv', () => {
  it('exports filtered rows in major units with a header and attachment headers', async () => {
    const { app, get, seed } = await setup();
    await seed({ fullName: '=cmd, "x"', email: 'a@x.example' });
    await seed({
      fullName: 'Kenji',
      email: 'k@x.example',
      countryCode: 'JP',
      salaryMinor: 3_800_000,
    });
    const res = await get('/api/employees/export.csv?country=JP');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="employees.csv"');
    const lines = res.body.trim().split('\r\n');
    expect(lines[0]).toBe(
      'Code,Name,Email,Department,Job title,Level,Country,Employment type,Gender,Hire date,Annual salary,Currency',
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(
      /^[^,]+,Kenji,k@x.example,Engineering,Software Engineer,senior,JP,full_time,female,2021-04-12,3800000,JPY$/,
    );
    const all = await get('/api/employees/export.csv');
    expect(all.body).toContain(`"'=cmd, ""x"""`);
    expect(all.body).toContain('3800000.00');
    await app.close();
  });
});

describe('GET /api/employees/export.csv streaming', () => {
  it('produces exactly the text the old in-memory builder produced', async () => {
    const { app, get, seed } = await setup();
    await seed({ fullName: 'Zed', email: 'z@x.example', salaryMinor: 5 });
    await seed({ fullName: '@sum, "q"', email: 'q@x.example', countryCode: 'JP', salaryMinor: 7 });
    await seed({ fullName: 'Anna', email: 'a@x.example', countryCode: 'DE', salaryMinor: 123_456 });
    const rows = await db
      .selectFrom('employees')
      .selectAll()
      .orderBy('fullName', 'desc')
      .orderBy('id')
      .execute();
    const header = ['Code', 'Name', 'Email', 'Department', 'Job title', 'Level', 'Country'];
    const expected =
      csvRow([...header, 'Employment type', 'Gender', 'Hire date', 'Annual salary', 'Currency']) +
      rows
        .map((e) =>
          csvRow([
            e.employeeCode,
            e.fullName,
            e.email,
            e.department,
            e.jobTitle,
            e.level,
            e.countryCode,
            e.employmentType,
            e.gender,
            e.hireDate,
            formatMajor(e.salaryMinor, e.countryCode),
            getCountry(e.countryCode).currency,
          ]),
        )
        .join('');
    expect((await get('/api/employees/export.csv?sort=name:desc')).body).toBe(expected);
    await app.close();
  });
});

describe('GET /api/meta/filters', () => {
  it('lists filter options', async () => {
    const { app, get } = await setup();
    const body = (await get('/api/meta/filters')).json();
    expect(body.countries).toContainEqual({ code: 'JP', name: 'Japan', currency: 'JPY' });
    expect(body.departments).toContainEqual({
      name: 'Product',
      jobTitles: ['Product Designer', 'Product Manager'],
    });
    expect(body.levels).toEqual(['junior', 'mid', 'senior', 'lead', 'principal']);
    expect(body.employmentTypes).toEqual(['full_time', 'part_time', 'contract']);
    expect(body.genders).toEqual(['female', 'male']);
    await app.close();
  });
});
