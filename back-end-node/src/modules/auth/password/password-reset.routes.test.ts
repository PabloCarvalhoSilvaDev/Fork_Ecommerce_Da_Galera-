import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

process.env.DB_HOST ||= "127.0.0.1";
process.env.DB_PORT ||= "5432";
process.env.DB_DATABASE ||= "ecommerce_test";
process.env.DB_USER ||= "ecommerce_test";
process.env.DB_PASSWORD ||= "ecommerce_test";
process.env.JWT_SECRET ||= "test-jwt-secret-for-password-reset-route";
process.env.NODE_ENV = "test";

const { app } = await import("../../../app/app.js");

test("invalid reset token directs the user back to forgot password", async () => {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/auth/reset/invalid-token`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: "Senha-forte-123!",
          confirmPassword: "Senha-forte-123!",
        }),
      },
    );
    const body = (await response.json()) as {
      error: string;
      redirectTo: string;
    };

    assert.equal(response.status, 400);
    assert.equal(body.redirectTo, "/auth/forgot");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
