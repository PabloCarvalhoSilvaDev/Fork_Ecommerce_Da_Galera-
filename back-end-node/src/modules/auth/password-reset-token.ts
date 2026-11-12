import { createHash, randomBytes } from 'node:crypto';

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

export function createPasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isPasswordResetTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
