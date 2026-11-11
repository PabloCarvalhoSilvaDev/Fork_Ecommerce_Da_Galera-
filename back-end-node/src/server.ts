import { app } from './app/app.js';
import { env } from './config/env.js';
import { pool } from './database/pool.js';

async function startServer(): Promise<void> {
  await pool.query('SELECT 1');
  console.info('Conexão com PostgreSQL estabelecida.');

  const server = app.listen(env.PORT, () => {
    console.info(`API Node disponível na porta ${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;

    server.close((error) => {
      if (error) {
        console.error('Erro ao encerrar o servidor HTTP:', error);
        process.exitCode = 1;
      }

      void pool
        .end()
        .then(() => {
          console.info('Conexão com PostgreSQL encerrada.');
        })
        .catch((poolError: unknown) => {
          console.error('Erro ao encerrar o pool do PostgreSQL:', poolError);
          process.exitCode = 1;
        });
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer().catch(async (error: unknown) => {
  console.error('Não foi possível iniciar a API:', error);
  await pool.end();
  process.exitCode = 1;
});
