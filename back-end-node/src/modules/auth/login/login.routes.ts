import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import type { QueryResultRow } from "pg";
import { env } from "../../../config/env.js";
import { pool } from "../../../database/pool.js";
import { loginSchema } from "./login.schema.js";
import { createSessionToken } from "../session/session-token.js";

interface LoginUser extends QueryResultRow {
  id: string;
  fullName: string;
  email: string;
  role: "CLIENTE" | "ADMIN";
  passwordHash: string;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login. Tente novamente mais tarde.",
  },
  handler: (_request, response) => {
    console.log("[Login] Acesso recusado: limite de tentativas excedido.");
    response.status(429).json({
      error: "Muitas tentativas de login. Tente novamente mais tarde.",
    });
  },
});

export const loginRoutes = Router();

loginRoutes.post("/login", loginLimiter, async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    console.log("[Login] Acesso recusado: dados de login inválidos.");
    response.status(400).json({
      error: "Dados de login inválidos",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query<LoginUser>(
      `SELECT
         id,
         full_name AS "fullName",
         email,
         role,
         password_hash AS "passwordHash"
       FROM ecommerce.users
       WHERE email = $1
         AND is_active = TRUE
         AND deleted_at IS NULL
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      console.log("[Login] Acesso recusado: credenciais inválidas.");
      response.status(401).json({ error: "E-mail ou senha inválidos" });
      return;
    }

    const token =
      user.role === "CLIENTE"
        ? createSessionToken(
            { userId: user.id, role: "CLIENTE", context: "STORE" },
            env.JWT_SECRET,
            env.JWT_EXPIRES_IN_SECONDS,
          )
        : createSessionToken(
            { userId: user.id, role: "ADMIN" },
            env.JWT_SECRET,
            env.JWT_EXPIRES_IN_SECONDS,
          );

    console.log("[Login] Autenticação concluída.");
    response.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      redirectTo: user.role === "CLIENTE" ? "/catalog/home" : "/auth/context",
    });
  } catch (error) {
    console.log("[Login] Erro ao processar autenticação.");
    next(error);
  }
});
