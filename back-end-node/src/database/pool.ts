import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  application_name: 'ecommerce-da-galera-node',
});

pool.on('error', (error) => {
  console.error('Erro inesperado na conexão com PostgreSQL:', error);
});
