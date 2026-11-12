import assert from "node:assert/strict";
import test from "node:test";
import { registerCustomerSchema } from "./register.schema.js";

const validCustomer = {
  fullName: "  Cliente da Galera ",
  email: " CLIENTE@EXEMPLO.COM ",
  password: "Senha-segura-123!",
  confirmPassword: "Senha-segura-123!",
  documentNumber: "12345678900",
  phone: "5511999999999",
};

test("normalizes the registration fields accepted by the database schema", () => {
  const result = registerCustomerSchema.safeParse(validCustomer);

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.data.fullName, "Cliente da Galera");
  assert.equal(result.data.email, "cliente@exemplo.com");
  assert.equal(result.data.documentNumber, "12345678900");
  assert.equal(result.data.phone, "5511999999999");
});

test("allows an omitted phone because the database column is nullable", () => {
  const { phone: _phone, ...customerWithoutPhone } = validCustomer;
  const result = registerCustomerSchema.safeParse(customerWithoutPhone);

  assert.equal(result.success, true);
});

test("requires every password complexity rule", () => {
  const invalidPasswords = [
    "S1!abc",
    "senha123!",
    "SENHA123!",
    "Senhaabc!",
    "Senha1234",
  ];

  for (const password of invalidPasswords) {
    const result = registerCustomerSchema.safeParse({
      ...validCustomer,
      password,
      confirmPassword: password,
    });

    assert.equal(
      result.success,
      false,
      `Expected "${password}" to be rejected`,
    );
    if (!result.success) {
      assert.ok(
        result.error.issues.some((issue) => issue.path.includes("password")),
      );
    }
  }
});

test("rejects mismatched passwords and invalid document numbers", () => {
  const result = registerCustomerSchema.safeParse({
    ...validCustomer,
    confirmPassword: "outra-senha",
    documentNumber: "123",
  });

  assert.equal(result.success, false);
  if (result.success) return;

  assert.ok(
    result.error.issues.some((issue) => issue.path.includes("confirmPassword")),
  );
  assert.ok(
    result.error.issues.some((issue) => issue.path.includes("documentNumber")),
  );
});

test("accepts accented names and rejects names or numeric fields with forbidden characters", () => {
  const accentedName = registerCustomerSchema.safeParse({
    ...validCustomer,
    fullName: "  João da Silva  ",
  });
  const nameWithNumber = registerCustomerSchema.safeParse({
    ...validCustomer,
    fullName: "João Silva 2",
  });
  const formattedDocument = registerCustomerSchema.safeParse({
    ...validCustomer,
    documentNumber: "123.456.789-00",
  });
  const phoneWithPlus = registerCustomerSchema.safeParse({
    ...validCustomer,
    phone: "+5511999999999",
  });

  assert.equal(accentedName.success, true);
  assert.equal(nameWithNumber.success, false);
  assert.equal(formattedDocument.success, false);
  assert.equal(phoneWithPlus.success, false);
});

test("rejects role injection and passwords exceeding bcrypt byte limits", () => {
  const roleInjection = registerCustomerSchema.safeParse({
    ...validCustomer,
    role: "ADMIN",
  });
  const longPassword = "ç".repeat(37);
  const oversizedPassword = registerCustomerSchema.safeParse({
    ...validCustomer,
    password: longPassword,
    confirmPassword: longPassword,
  });

  assert.equal(roleInjection.success, false);
  assert.equal(oversizedPassword.success, false);
});
