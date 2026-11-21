import { z } from 'zod';
import { emailSchema } from './common.ts';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Enter your password' }).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
