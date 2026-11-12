/**
 * As telas do Angular usam as mesmas rotas do back (/auth/login, /auth/register...),
 * que também são caminhos da API do Node. Navegação do navegador (GET de HTML)
 * fica com o Angular; o resto (chamadas da API) vai para o Node.
 */
export default {
  '/auth': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: (req) => {
      if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
        return '/index.html';
      }
      return undefined;
    },
  },
};
