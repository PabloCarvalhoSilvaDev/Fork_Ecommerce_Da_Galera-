import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { QueryResultRow } from 'pg';
import { env } from '../../config/env.js';
import { pool } from '../../database/pool.js';
import { registerCustomerSchema } from './register.schema.js';

interface RegisteredCustomer extends QueryResultRow {
  id: string;
  fullName: string;
  email: string;
  documentNumber: string;
  phone: string | null;
  role: 'CLIENTE';
  createdAt: Date;
}

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
});

export const registerRoutes = Router();

registerRoutes.post('/register', registrationLimiter, async (request, response, next) => {
  const parsed = registerCustomerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: 'Dados de cadastro inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { fullName, email, password, documentNumber, phone } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query<RegisteredCustomer>(
      `INSERT INTO ecommerce.users
        (full_name, email, password_hash, role, document_number, phone)
       VALUES ($1, $2, $3, 'CLIENTE'::ecommerce.user_role, $4, $5)
       RETURNING id,
         full_name AS "fullName",
         email,
         document_number AS "documentNumber",
         phone,
         role,
         created_at AS "createdAt"`,
      [fullName, email, passwordHash, documentNumber, phone ?? null],
    );

    const customer = result.rows[0];
    const token = jwt.sign(
      { role: customer.role, context: 'STORE' },
      env.JWT_SECRET,
      { subject: customer.id, expiresIn: env.JWT_EXPIRES_IN_SECONDS },
    );

    response.status(201).json({ user: customer, token });
  } catch (error) {
    if (isUniqueViolation(error)) {
      response.status(409).json({ error: 'E-mail ou documento já cadastrado' });
      return;
    }

    next(error);
  }
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
