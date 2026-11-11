import { Buffer } from 'node:buffer';
import { z } from 'zod';

const documentNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9./\-\s]+$/, 'Informe apenas os números do CPF ou CNPJ')
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().regex(/^(?:\d{11}|\d{14})$/, 'Informe um CPF com 11 ou CNPJ com 14 dígitos'));

const phoneSchema = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && !value.trim()) ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Informe um telefone no padrão E.164')
    .optional(),
);

export const registerCustomerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres').max(150),
    email: z.string().trim().email('Informe um e-mail válido').max(254).toLowerCase(),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
        message: 'A senha deve ter no máximo 72 bytes',
      }),
    confirmPassword: z.string(),
    documentNumber: documentNumberSchema,
    phone: phoneSchema,
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação da senha não confere',
    path: ['confirmPassword'],
  });

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
