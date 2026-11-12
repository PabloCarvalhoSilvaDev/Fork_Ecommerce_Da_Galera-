import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

export type AuthRole = "CLIENTE" | "ADMIN";
export type AuthContext = "STORE" | "ADMIN";

export interface SessionClaims {
  sub: string;
  jti: string;
  exp: number;
  role: AuthRole;
  context?: AuthContext;
}

type SessionTokenInput =
  | { userId: string; role: "CLIENTE"; context: "STORE" }
  | { userId: string; role: "ADMIN"; context?: AuthContext };

export function createSessionToken(
  input: SessionTokenInput,
  secret: string,
  expiresInSeconds: number,
): string {
  const claims: { role: AuthRole; context?: AuthContext } = {
    role: input.role,
  };
  if (input.context) {
    claims.context = input.context;
  }

  return jwt.sign(claims, secret, {
    subject: input.userId,
    jwtid: randomUUID(),
    expiresIn: expiresInSeconds,
  });
}

export function verifySessionToken(
  token: string,
  secret: string,
): SessionClaims | null {
  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }

  if (typeof payload === "string") {
    return null;
  }

  const { sub, jti, exp, role, context } = payload;
  if (
    typeof sub !== "string" ||
    typeof jti !== "string" ||
    typeof exp !== "number" ||
    (role !== "CLIENTE" && role !== "ADMIN") ||
    (context !== undefined && context !== "STORE" && context !== "ADMIN")
  ) {
    return null;
  }

  if (role === "CLIENTE" && context !== "STORE") {
    return null;
  }

  return {
    sub,
    jti,
    exp,
    role,
    ...(context ? { context } : {}),
  };
}

export function getBearerToken(
  authorization: string | undefined,
): string | null {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}
