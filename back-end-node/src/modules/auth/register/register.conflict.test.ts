import assert from 'node:assert/strict';
import test from 'node:test';
import { getRegistrationConflict } from './register.conflict.js';

test('identifies an already registered email', () => {
  assert.deepEqual(
    getRegistrationConflict({ code: '23505', constraint: 'users_email_key' }),
    { field: 'email', error: 'Este e-mail já está cadastrado.' },
  );
});

test('identifies an already registered document number', () => {
  assert.deepEqual(
    getRegistrationConflict({
      code: '23505',
      constraint: 'users_document_number_key',
    }),
    { field: 'documentNumber', error: 'Este CPF ou CNPJ já está cadastrado.' },
  );
});

test('keeps a general conflict message for other unique constraints', () => {
  assert.deepEqual(getRegistrationConflict({ code: '23505' }), {
    error: 'E-mail ou documento já cadastrado',
  });
  assert.equal(getRegistrationConflict({ code: '23503' }), null);
});
