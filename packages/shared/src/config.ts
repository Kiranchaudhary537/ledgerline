// The single place to change app behaviour: every tunable value lives here, with its unit and why.
// Secrets and per-environment infrastructure (DATABASE_URL, PORT, NODE_ENV…) are NOT here: they come
// from environment variables, validated once in apps/api/src/env.ts.
// No Node-only code in this file: the web app imports it too.

function deepFreeze<T extends object>(value: T): T {
  for (const child of Object.values(value)) {
    if (typeof child === 'object' && child !== null) deepFreeze(child);
  }
  return Object.freeze(value);
}

export const config = deepFreeze({
  paging: {
    defaultPageSize: 25, // rows: fits a desktop screen without scrolling the page
    maxPageSize: 100, // rows: caps the cost of one list request
  },

  search: {
    minLength: 2, // characters: one letter matches nearly every row
    maxLength: 100, // characters: longer than any name or email
  },

  text: {
    fullNameMaxLength: 120, // characters: generous for long names, bounded for storage and CSV
    nameMaxLength: 80, // characters: department and job title names
    reasonMinLength: 3, // characters: forces a real reason in the salary history
    reasonMaxLength: 500, // characters: a short paragraph
    passwordMaxLength: 200, // characters: stops huge inputs reaching scrypt
  },

  session: {
    ttlSeconds: 8 * 60 * 60, // seconds: one working day; also the cookie lifetime
    tokenBytes: 32, // bytes of randomness: 256 bits, unguessable
  },

  cookie: {
    sessionName: 'session', // cookie name; the web never reads it (httpOnly)
  },

  rateLimit: {
    windowMs: 60_000, // milliseconds: both limits below are per window
    loginMax: 5, // requests per IP + email: slows password guessing
    apiMax: 300, // requests per user (IP before login): ~5/s, generous for one HR user
  },

  db: {
    poolSize: 10, // connections: ample for ~5 req/s, below Postgres' default cap of 100
  },

  scrypt: {
    cost: 2 ** 17, // N: OWASP minimum for scrypt
    blockSize: 8, // r: OWASP minimum
    parallelization: 1, // p: OWASP minimum
    keyLength: 32, // bytes of derived key
    saltBytes: 16, // bytes of random salt per password
    maxMemoryBytes: 256 * 1024 * 1024, // bytes: must exceed 128 * N * r (16 MiB) with headroom
  },

  insights: {
    defaultBuckets: 20, // buckets: readable histogram on a normal chart width
    maxBuckets: 50, // buckets: more than this is noise
    maxGroupByDimensions: 2, // fields: a third dimension leaves groups too small to mean anything
    genderGapMinGroupSize: 5, // people per gender: one person would swing the percentage
  },

  csv: {
    filename: 'employees.csv', // name offered by the browser when exporting
    streamBatchRows: 2000, // rows per cursor fetch: few round trips, small memory, and the first bytes go out early
  },

  ui: {
    searchDebounceMs: 300, // milliseconds: wait for a pause in typing before querying
    queryRetries: 2, // retries for failed reads (5xx / network only; 4xx never retry)
    sessionStaleMs: 300_000, // milliseconds: how long a checked login is trusted before re-asking
  },

  seed: {
    employeeCount: 10_000, // rows: enough for realistic insights, still seeds in seconds
    randomSeed: 42, // PRNG seed: same data on every run
    referenceDate: '2026-11-01', // ISO date used as "today", so output never depends on the run date
    bandSpread: 0.12, // fraction: how far a salary may sit from its band midpoint
    promotionChance: 0.15, // probability that a past raise was a promotion
    promotionRaise: [0.12, 0.2], // fraction range of a promotion raise
    annualRaise: [0.03, 0.08], // fraction range of a yearly review raise
    batchSize: 1_000, // rows per INSERT: well under Postgres' 65,535 parameter limit
    adminPasswordMinLength: 12, // characters: the seeded admin is a real login on a deployed app (the live demo login is deliberately shorter for reviewers, see README)
    adminName: 'HR Manager', // display name of the seeded login user
  },
} as const);
