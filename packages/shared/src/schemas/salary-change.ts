import { z } from 'zod';
import { salaryMinorSchema, versionSchema } from './common.ts';

export const salaryChangeSchema = z.object({
  newSalaryMinor: salaryMinorSchema,
  reason: z
    .string()
    .trim()
    .min(3, { error: 'Enter a reason (at least 3 characters)' })
    .max(500, { error: 'Reason is too long' }),
  version: versionSchema,
});

export type SalaryChangeInput = z.infer<typeof salaryChangeSchema>;
