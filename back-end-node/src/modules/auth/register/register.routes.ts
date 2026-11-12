import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { QueryResultRow } from "pg";
import { env } from "../../../config/env.js";
import { pool } from "../../../database/pool.js";
import { getRegistrationConflict } from "./register.conflict.js";
import { registerCustomerSchema } from "./register.schema.js";

interface RegisteredCustomer extends QueryResultRow {
  id: string;
  fullName: string;
  email: string;
  documentNumber: string;
  phone: string | null;
  role: "CLIENTE";
  createdAt: Date;
}

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
  },
  handler: (_request, response) => {
    console.log("[Cadastro] Cadastro recusado: limite de tentativas excedido.");
    response.status(429).json({
      error: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
    });
  },
});

export const registerRoutes = Router();

registerRoutes.post(
  "/register",
  registrationLimiter,
  async (request, response, next) => {
    const parsed = registerCustomerSchema.safeParse(request.body);

    if (!parsed.success) {
      console.log("[Cadastro] Cadastro recusado: dados de cadastro inválidos.");
      response.status(400).json({
        error: "Dados de cadastro inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { fullName, email, password, documentNumber, phone } = parsed.data;

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query<RegisteredCustomer>(
        `INSERT INTO ecommerce.users
        (full_name, email, password_hash, role, document_number, phone)
       VALUES ($1, $2, $3, 'CLIENTE'::ecommerce.user_role, $4, $5)
       RETURNING id,
         full_name AS "fullName",
         email,
         document_number AS "documentNumber",
         phone,
         role,
         created_at AS "createdAt"`,
        [fullName, email, passwordHash, documentNumber, phone ?? null],
      );

      const customer = result.rows[0];
      console.log("[Cadastro] Registro persistido no banco de dados.");
      const token = jwt.sign(
        { role: customer.role, context: "STORE" },
        env.JWT_SECRET,
        { subject: customer.id, expiresIn: env.JWT_EXPIRES_IN_SECONDS },
      );

      response.status(201).json({ user: customer, token });
    } catch (error) {
      const conflict = getRegistrationConflict(error);
      if (conflict) {
        console.log(
          conflict.field === "email"
            ? "[Cadastro] Cadastro recusado: e-mail já cadastrado."
            : conflict.field === "documentNumber"
              ? "[Cadastro] Cadastro recusado: documento já cadastrado."
              : "[Cadastro] Cadastro recusado por conflito de unicidade.",
        );
        response.status(409).json(conflict);
        return;
      }

      next(error);
    }
  },
);
