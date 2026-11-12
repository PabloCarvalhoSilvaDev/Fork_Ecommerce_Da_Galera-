import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import type { QueryResultRow } from "pg";
import { corsOrigins, env } from "../../../config/env.js";
import { pool } from "../../../database/pool.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./password-reset.schema.js";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenFormat,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
} from "./password-reset-token.js";

interface PasswordResetUser extends QueryResultRow {
  id: string;
}

const genericForgotMessage =
  "Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.";
const invalidResetMessage =
  "Token inválido ou expirado. Solicite uma nova redefinição.";

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    console.log(
      "[Esqueci-senha] Solicitação recusada: limite de tentativas excedido.",
    );
    response.status(429).json({
      error: "Muitas solicitações. Tente novamente mais tarde.",
    });
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    console.log("[Redefinição de senha] Tentativa recusada: limite excedido.");
    response.status(429).json({
      error: "Muitas tentativas. Tente novamente mais tarde.",
    });
  },
});

export const passwordResetRoutes = Router();

passwordResetRoutes.post(
  "/forgot",
  forgotPasswordLimiter,
  async (request, response, next) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      console.log("[Esqueci-senha] Solicitação recusada: e-mail inválido.");
      response.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    if (env.NODE_ENV === "production") {
      console.log(
        "[Esqueci-senha] Serviço indisponível: entrega de e-mail não configurada.",
      );
      response
        .status(503)
        .json({ error: "Recuperação de senha temporariamente indisponível" });
      return;
    }

    try {
      const frontendOrigin = corsOrigins[0];
      if (!frontendOrigin) {
        throw new Error(
          "CORS_ORIGIN precisa incluir a origem do frontend para gerar o link.",
        );
      }
      const resetUrl = new URL("/redefinir-senha", frontendOrigin);

      const userResult = await pool.query<PasswordResetUser>(
        `SELECT id
       FROM ecommerce.users
       WHERE email = $1
         AND is_active = TRUE
         AND deleted_at IS NULL
       LIMIT 1`,
        [parsed.data.email],
      );

      const user = userResult.rows[0];
      if (user) {
        const { token, tokenHash } = createPasswordResetToken();
        resetUrl.searchParams.set("token", token);

        await pool.query(
          `INSERT INTO ecommerce.password_reset_tokens
           (user_id, token_hash, expires_at, used_at)
         VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'), NULL)
         ON CONFLICT (user_id) DO UPDATE
         SET token_hash = EXCLUDED.token_hash,
             expires_at = EXCLUDED.expires_at,
             used_at = NULL,
             created_at = NOW()`,
          [user.id, tokenHash, PASSWORD_RESET_TOKEN_TTL_MINUTES],
        );

        console.log(
          `[Esqueci-senha] Link de redefinição (expira em ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos): ${resetUrl}`,
        );
      } else {
        console.log(
          "[Esqueci-senha] Solicitação processada sem conta correspondente.",
        );
      }

      response.status(200).json({ message: genericForgotMessage });
    } catch (error) {
      console.log("[Esqueci-senha] Erro ao processar solicitação.");
      next(error);
    }
  },
);

passwordResetRoutes.post(
  "/reset/:token",
  resetPasswordLimiter,
  async (request, response, next) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      console.log(
        "[Redefinição de senha] Solicitação recusada: dados inválidos.",
      );
      response.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const token = request.params.token;
    if (typeof token !== "string" || !isPasswordResetTokenFormat(token)) {
      console.log(
        "[Redefinição de senha] Solicitação recusada: token inválido ou expirado.",
      );
      response.status(400).json({ error: invalidResetMessage });
      return;
    }

    const tokenHash = hashPasswordResetToken(token);
    const client = await pool.connect();
    let transactionOpen = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;

      const tokenResult = await client.query<PasswordResetUser>(
        `SELECT user_id AS id
         FROM ecommerce.password_reset_tokens
         WHERE token_hash = $1
           AND expires_at > NOW()
           AND used_at IS NULL
         FOR UPDATE`,
        [tokenHash],
      );
      const resetUser = tokenResult.rows[0];

      if (!resetUser) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        console.log(
          "[Redefinição de senha] Solicitação recusada: token inválido ou expirado.",
        );
        response.status(400).json({ error: invalidResetMessage });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const updateResult = await client.query(
        `UPDATE ecommerce.users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2
           AND is_active = TRUE
           AND deleted_at IS NULL
         RETURNING id`,
        [passwordHash, resetUser.id],
      );

      if (updateResult.rowCount !== 1) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        console.log(
          "[Redefinição de senha] Solicitação recusada: token inválido ou expirado.",
        );
        response.status(400).json({ error: invalidResetMessage });
        return;
      }

      await client.query(
        `UPDATE ecommerce.password_reset_tokens
         SET used_at = NOW()
         WHERE user_id = $1`,
        [resetUser.id],
      );
      await client.query("COMMIT");
      transactionOpen = false;

      console.log(
        "[Redefinição de senha] Senha atualizada e token invalidado.",
      );
      response
        .status(200)
        .json({ message: "Senha redefinida com sucesso. Faça login." });
    } catch (error) {
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "[Redefinição de senha] Falha ao reverter transação:",
            rollbackError,
          );
        }
      }

      console.log("[Redefinição de senha] Erro ao processar solicitação.");
      next(error);
    } finally {
      client.release();
    }
  },
);
