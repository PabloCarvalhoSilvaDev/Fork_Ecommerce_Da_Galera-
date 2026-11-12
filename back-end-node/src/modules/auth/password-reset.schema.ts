import { z } from 'zod';
import { customerPasswordSchema } from './password.schema.js';

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email('Informe um e-mail válido').max(254).toLowerCase(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    password: customerPasswordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação da senha não confere',
    path: ['confirmPassword'],
  });
