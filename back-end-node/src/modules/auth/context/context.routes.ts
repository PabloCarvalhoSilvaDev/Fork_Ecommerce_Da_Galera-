import { Router } from "express";
import type { QueryResultRow } from "pg";
import { env } from "../../../config/env.js";
import { pool } from "../../../database/pool.js";
import { contextSelectionSchema } from "./context.schema.js";
import {
  createSessionToken,
  getBearerToken,
  verifySessionToken,
} from "../session/session-token.js";

interface AdminUser extends QueryResultRow {
  id: string;
  fullName: string;
  email: string;
}

export const contextRoutes = Router();

contextRoutes.post("/context", async (request, response, next) => {
  const parsed = contextSelectionSchema.safeParse(request.body);
  if (!parsed.success) {
    console.log("[Contexto] Solicitação recusada: contexto inválido.");
    response.status(400).json({
      error: "Contexto inválido",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const token = getBearerToken(request.get("authorization"));
  const session = token ? verifySessionToken(token, env.JWT_SECRET) : null;
  if (!session) {
    console.log("[Contexto] Acesso recusado: token ausente ou inválido.");
    response.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  if (session.role !== "ADMIN") {
    console.log(
      "[Contexto] Acesso recusado: somente administradores podem escolher contexto.",
    );
    response
      .status(403)
      .json({ error: "Apenas administradores podem escolher contexto" });
    return;
  }

  try {
    const revokedToken = await pool.query(
      "SELECT 1 FROM ecommerce.revoked_tokens WHERE jti = $1 AND expires_at > NOW()",
      [session.jti],
    );
    if (revokedToken.rowCount) {
      console.log("[Contexto] Acesso recusado: sessão encerrada.");
      response.status(401).json({ error: "Sessão encerrada" });
      return;
    }

    const result = await pool.query<AdminUser>(
      `SELECT
         id,
         full_name AS "fullName",
         email
       FROM ecommerce.users
       WHERE id = $1
         AND role = 'ADMIN'::ecommerce.user_role
         AND is_active = TRUE
         AND deleted_at IS NULL
       LIMIT 1`,
      [session.sub],
    );
    const admin = result.rows[0];

    if (!admin) {
      console.log("[Contexto] Acesso recusado: conta administrativa inativa.");
      response.status(403).json({
        error: "Apenas administradores ativos podem escolher contexto",
      });
      return;
    }

    const { context } = parsed.data;
    const token = createSessionToken(
      { userId: admin.id, role: "ADMIN", context },
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN_SECONDS,
    );
    const redirectTo =
      context === "STORE" ? "/catalog/home" : "/admin/dashboard";

    console.log(`[Contexto] Administrador autenticado no contexto ${context}.`);
    response.status(200).json({
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: "ADMIN",
      },
      context,
      token,
      redirectTo,
    });
  } catch (error) {
    console.log("[Contexto] Erro ao selecionar contexto.");
    next(error);
  }
});
