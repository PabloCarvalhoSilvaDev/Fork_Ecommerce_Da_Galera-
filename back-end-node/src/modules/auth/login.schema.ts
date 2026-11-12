import { Buffer } from 'node:buffer';
import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.string().trim().email('Informe um e-mail válido').max(254).toLowerCase(),
    password: z
      .string()
      .min(1, 'Informe sua senha')
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
        message: 'A senha excede o limite permitido',
      }),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
