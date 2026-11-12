import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import {
  createSessionToken,
  getBearerToken,
  verifySessionToken,
} from "./session-token.js";

const secret = "test-secret-with-at-least-32-characters";

test("creates verifiable sessions with unique jti and optional context", () => {
  const clientToken = createSessionToken(
    { userId: "client-id", role: "CLIENTE", context: "STORE" },
    secret,
    60,
  );
  const adminToken = createSessionToken(
    { userId: "admin-id", role: "ADMIN" },
    secret,
    60,
  );
  const clientSession = verifySessionToken(clientToken, secret);
  const adminSession = verifySessionToken(adminToken, secret);

  assert.equal(clientSession?.role, "CLIENTE");
  assert.equal(clientSession?.context, "STORE");
  assert.equal(typeof clientSession?.jti, "string");
  assert.equal(adminSession?.role, "ADMIN");
  assert.equal(adminSession?.context, undefined);
  assert.notEqual(clientSession?.jti, adminSession?.jti);
});

test("rejects invalid and expired sessions", () => {
  const expiredToken = createSessionToken(
    { userId: "admin-id", role: "ADMIN" },
    secret,
    -1,
  );

  assert.equal(verifySessionToken("invalid", secret), null);
  assert.equal(verifySessionToken(expiredToken, secret), null);
});

test("rejects client sessions without STORE context or with ADMIN context", () => {
  const missingContext = jwt.sign({ role: "CLIENTE" }, secret, {
    subject: "client-id",
    jwtid: "missing-context",
    expiresIn: 60,
  });
  const adminContext = jwt.sign({ role: "CLIENTE", context: "ADMIN" }, secret, {
    subject: "client-id",
    jwtid: "admin-context",
    expiresIn: 60,
  });

  assert.equal(verifySessionToken(missingContext, secret), null);
  assert.equal(verifySessionToken(adminContext, secret), null);
});

test("extracts only bearer authorization tokens", () => {
  assert.equal(getBearerToken("Bearer access-token"), "access-token");
  assert.equal(getBearerToken("Basic access-token"), null);
  assert.equal(getBearerToken(undefined), null);
});
