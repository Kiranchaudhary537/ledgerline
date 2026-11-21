import { describe, expect, it } from 'vitest';
import { InsightsService, type InsightsStore } from './service.ts';

function serviceWith(distribution: InsightsStore['distribution']) {
  return new InsightsService({ distribution } as InsightsStore);
}

describe('InsightsService.distribution', () => {
  it('gives an empty result the currency of the one chosen country', async () => {
    const service = serviceWith(async () => ({ currency: null, buckets: [] }));
    expect(await service.distribution({ country: ['JP'], buckets: 5 })).toEqual({
      currency: 'JPY',
      buckets: [],
    });
  });

  it('keeps the currency and buckets the repository found', async () => {
    const buckets = [{ from: 1, to: 2, count: 3 }];
    const service = serviceWith(async () => ({ currency: 'INR', buckets }));
    expect(await service.distribution({ country: ['IN'], buckets: 1 })).toEqual({
      currency: 'INR',
      buckets,
    });
  });
});
