import assert from "node:assert/strict";
import test from "node:test";
import { contextSelectionSchema } from "./context.schema.js";

test("accepts only documented application contexts", () => {
  assert.equal(
    contextSelectionSchema.safeParse({ context: "STORE" }).success,
    true,
  );
  assert.equal(
    contextSelectionSchema.safeParse({ context: "ADMIN" }).success,
    true,
  );
});

test("rejects invalid contexts and extra fields", () => {
  assert.equal(
    contextSelectionSchema.safeParse({ context: "CLIENTE" }).success,
    false,
  );
  assert.equal(
    contextSelectionSchema.safeParse({ context: "ADMIN", role: "ADMIN" })
      .success,
    false,
  );
});
