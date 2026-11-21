import { z } from 'zod';
import { config } from '../config.ts';
import { salaryMinorSchema, versionSchema } from './common.ts';

export const salaryChangeSchema = z.object({
  newSalaryMinor: salaryMinorSchema,
  reason: z
    .string()
    .trim()
    .min(config.text.reasonMinLength, {
      error: `Enter a reason (at least ${config.text.reasonMinLength} characters)`,
    })
    .max(config.text.reasonMaxLength, { error: 'Reason is too long' }),
  version: versionSchema,
});

export type SalaryChangeInput = z.infer<typeof salaryChangeSchema>;
