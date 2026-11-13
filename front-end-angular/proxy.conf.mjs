/**
 * As chamadas da API vão para o Node; rotas de navegação do navegador ficam com o Angular.
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
  '/catalog': {
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
  '/cart': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
};
