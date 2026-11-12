import { Buffer } from 'node:buffer';
import { z } from 'zod';

export const customerPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/\d/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9\s]/, 'A senha deve conter pelo menos um caractere especial')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'A senha deve ter no máximo 72 bytes',
  });
