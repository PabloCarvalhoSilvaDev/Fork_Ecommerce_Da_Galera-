import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessao } from './sessao';

/**
 * Telas que precisam de login (entrega, pagamento, pedidos).
 * Sem sessão, vai para o login e volta para a mesma tela depois.
 */
export const exigeLogin: CanActivateFn = (_rota, estado) => {
  if (inject(Sessao).logado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { retorno: estado.url },
  });
};
