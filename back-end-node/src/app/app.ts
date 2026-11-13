import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { corsOrigins } from "../config/env.js";
import { cartRoutes } from "../modules/cart/cart.routes.js";
import { catalogRoutes } from "../modules/catalog/catalog.routes.js";
import { contextRoutes } from "../modules/auth/context/context.routes.js";
import { loginRoutes } from "../modules/auth/login/login.routes.js";
import { logoutRoutes } from "../modules/auth/logout/logout.routes.js";
import { passwordResetRoutes } from "../modules/auth/password/password-reset.routes.js";
import { registerRoutes } from "../modules/auth/register/register.routes.js";

const app = express();

app.disable("x-powered-by");
app.use((request, response, next) => {
  const startedAt = process.hrtime.bigint();
  let recorded = false;
  const recordRequest = (aborted = false): void => {
    if (recorded) return;
    recorded = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const prefix = ["/auth", "/catalog", "/cart"].find(
      (basePath) =>
        request.originalUrl === basePath ||
        request.originalUrl.startsWith(`${basePath}/`),
    );
    const route = request.route
      ? `${prefix ?? ""}${String(request.route.path)}`
      : "unmatched";
    const status = `${response.statusCode} ${durationMs.toFixed(1)}ms`;
    const termination = aborted ? " aborted" : "";
    console.info(`[HTTP] ${request.method} ${route} ${status}${termination}`);
  };
  response.once("finish", () => recordRequest());
  response.once("close", () => {
    if (!response.writableFinished) recordRequest(true);
  });
  next();
});
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/auth", registerRoutes);
app.use("/auth", loginRoutes);
app.use("/auth", contextRoutes);
app.use("/auth", logoutRoutes);
app.use("/auth", passwordResetRoutes);
app.use("/catalog", catalogRoutes);
app.use("/cart", cartRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: "Rota não encontrada" });
});

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (typeof error === "object" && error !== null && "type" in error) {
    if (error.type === "entity.parse.failed") {
      response.status(400).json({ error: "Corpo JSON inválido" });
      return;
    }

    if (error.type === "entity.too.large") {
      response
        .status(413)
        .json({ error: "Corpo da requisição excede o limite permitido" });
      return;
    }
  }

  console.error("Erro não tratado na API:", error);
  response.status(500).json({ error: "Erro interno do servidor" });
};

app.use(errorHandler);

export { app };
