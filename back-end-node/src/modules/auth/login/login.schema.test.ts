import assert from 'node:assert/strict';
import test from 'node:test';
import { loginSchema } from './login.schema.js';

test('normalizes login email and allows existing passwords without registration rules', () => {
  const result = loginSchema.safeParse({
    email: ' CLIENTE@EXEMPLO.COM ',
    password: 'legacy',
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.data.email, 'cliente@exemplo.com');
  assert.equal(result.data.password, 'legacy');
});

test('rejects invalid login fields, passwords over bcrypt limit, and extra fields', () => {
  const invalidCases = [
    { email: 'not-an-email', password: 'password' },
    { email: 'cliente@exemplo.com', password: '' },
    { email: 'cliente@exemplo.com', password: 'ç'.repeat(37) },
    { email: 'cliente@exemplo.com', password: 'password', role: 'ADMIN' },
  ];

  for (const body of invalidCases) {
    assert.equal(loginSchema.safeParse(body).success, false);
  }
});
