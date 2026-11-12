export interface RegistrationConflict {
  field?: 'email' | 'documentNumber';
  error: string;
}

export function getRegistrationConflict(
  error: unknown,
): RegistrationConflict | null {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    error.code !== '23505'
  ) {
    return null;
  }

  const constraint =
    'constraint' in error && typeof error.constraint === 'string'
      ? error.constraint
      : undefined;

  if (constraint === 'users_email_key') {
    return { field: 'email', error: 'Este e-mail já está cadastrado.' };
  }

  if (constraint === 'users_document_number_key') {
    return {
      field: 'documentNumber',
      error: 'Este CPF ou CNPJ já está cadastrado.',
    };
  }

  return { error: 'E-mail ou documento já cadastrado' };
}
