import { z } from "zod";
import { customerPasswordSchema } from "./password.schema.js";

const documentNumberSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Informe apenas os números do CPF ou CNPJ")
  .pipe(
    z
      .string()
      .regex(
        /^(?:\d{11}|\d{14})$/,
        "Informe um CPF com 11 ou CNPJ com 14 dígitos",
      ),
  );

const phoneSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && !value.trim())
      ? undefined
      : value,
  z
    .string()
    .trim()
    .regex(
      /^[1-9]\d{9,14}$/,
      "Informe um telefone no padrão E.164, usando apenas números",
    )
    .optional(),
);

export const registerCustomerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "O nome deve ter pelo menos 3 caracteres")
      .max(150)
      .regex(
        /^[\p{L}\p{M} ]+$/u,
        "Informe o nome usando apenas letras e espaços",
      ),
    email: z
      .string()
      .trim()
      .email("Informe um e-mail válido")
      .max(254)
      .toLowerCase(),
    password: customerPasswordSchema,
    confirmPassword: z.string(),
    documentNumber: documentNumberSchema,
    phone: phoneSchema,
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmação da senha não confere",
    path: ["confirmPassword"],
  });

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
