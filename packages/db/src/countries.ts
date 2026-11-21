import { COUNTRIES } from '@acme/shared';
import type { Db } from './client.ts';

/** Countries come from shared constants (single source); safe to run repeatedly. */
export async function upsertCountries(db: Db): Promise<void> {
  await db
    .insertInto('countries')
    .values(
      COUNTRIES.map(({ code, name, currency, locale, minorUnit }) => ({
        code,
        name,
        currency,
        locale,
        minorUnit,
      })),
    )
    .onConflict((oc) =>
      oc.column('code').doUpdateSet((eb) => ({
        name: eb.ref('excluded.name'),
        currency: eb.ref('excluded.currency'),
        locale: eb.ref('excluded.locale'),
        minorUnit: eb.ref('excluded.minorUnit'),
      })),
    )
    .execute();
}
