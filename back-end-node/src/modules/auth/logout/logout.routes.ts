import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../../config/env.js";
import { pool } from "../../../database/pool.js";
import {
  getBearerToken,
  verifySessionToken,
} from "../session/session-token.js";

const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    console.log(
      "[Logout] Solicitação recusada: limite de tentativas excedido.",
    );
    response
      .status(429)
      .json({ error: "Muitas solicitações. Tente novamente mais tarde." });
  },
});

export const logoutRoutes = Router();

logoutRoutes.post("/logout", logoutLimiter, async (request, response, next) => {
  const token = getBearerToken(request.get("authorization"));
  const session = token ? verifySessionToken(token, env.JWT_SECRET) : null;
  if (!session) {
    console.log("[Logout] Acesso recusado: token ausente ou inválido.");
    response.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  try {
    await pool.query(
      "DELETE FROM ecommerce.revoked_tokens WHERE expires_at <= NOW()",
    );
    await pool.query(
      `INSERT INTO ecommerce.revoked_tokens (jti, user_id, expires_at)
       VALUES ($1, $2, TO_TIMESTAMP($3))
       ON CONFLICT (jti) DO NOTHING`,
      [session.jti, session.sub, session.exp],
    );

    console.log("[Logout] Sessão invalidada.");
    response.status(200).json({
      message: "Sessão encerrada com sucesso.",
      redirectTo: "/auth/login",
    });
  } catch (error) {
    console.log("[Logout] Erro ao encerrar sessão.");
    next(error);
  }
});
