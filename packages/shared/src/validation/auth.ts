import { z } from 'zod';
import { config } from '../config.ts';
import { emailSchema } from './common.ts';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Enter your password' }).max(config.text.passwordMaxLength),
});

export type LoginInput = z.infer<typeof loginSchema>;
