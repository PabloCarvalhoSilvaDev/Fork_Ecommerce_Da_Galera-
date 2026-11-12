import assert from 'node:assert/strict';
import test from 'node:test';
import { forgotPasswordSchema, resetPasswordSchema } from './password-reset.schema.js';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenFormat,
} from './password-reset-token.js';

test('normalizes valid forgot-password emails', () => {
  const result = forgotPasswordSchema.safeParse({ email: ' CLIENTE@EXEMPLO.COM ' });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.data.email, 'cliente@exemplo.com');
});

test('rejects invalid emails and extra forgot-password fields', () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success, false);
  assert.equal(
    forgotPasswordSchema.safeParse({ email: 'cliente@exemplo.com', password: 'secret' }).success,
    false,
  );
});

test('requires a strong matching password for reset', () => {
  const password = 'Senha-segura-123!';

  assert.equal(
    resetPasswordSchema.safeParse({ password, confirmPassword: password }).success,
    true,
  );
  assert.equal(
    resetPasswordSchema.safeParse({ password, confirmPassword: 'Senha-diferente-123!' }).success,
    false,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      password: 'senha-segura-123',
      confirmPassword: 'senha-segura-123',
    }).success,
    false,
  );
});

test('creates an opaque reset token and stores only its SHA-256 hash', () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.equal(isPasswordResetTokenFormat(first.token), true);
  assert.equal(first.tokenHash, hashPasswordResetToken(first.token));
  assert.equal(first.tokenHash.length, 64);
  assert.notEqual(first.token, first.tokenHash);
  assert.notEqual(first.token, second.token);
});
