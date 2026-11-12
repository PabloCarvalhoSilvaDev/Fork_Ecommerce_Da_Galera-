import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { corsOrigins } from '../config/env.js';
import { loginRoutes } from '../modules/auth/login.routes.js';
import { passwordResetRoutes } from '../modules/auth/password-reset.routes.js';
import { registerRoutes } from '../modules/auth/register.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/auth', registerRoutes);
app.use('/auth', loginRoutes);
app.use('/auth', passwordResetRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: 'Rota não encontrada' });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      response.status(400).json({ error: 'Corpo JSON inválido' });
      return;
    }

    if (error.type === 'entity.too.large') {
      response.status(413).json({ error: 'Corpo da requisição excede o limite permitido' });
      return;
    }
  }

  console.error('Erro não tratado na API:', error);
  response.status(500).json({ error: 'Erro interno do servidor' });
};

app.use(errorHandler);

export { app };
