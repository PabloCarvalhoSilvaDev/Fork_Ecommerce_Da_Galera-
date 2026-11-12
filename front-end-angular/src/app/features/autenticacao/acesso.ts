import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioSessao } from '../../core/sessao/sessao';

/** Resposta do Node em `POST /auth/login` e `POST /auth/context`. */
export interface RespostaSessao {
  user: UsuarioSessao;
  token: string;
  redirectTo: string;
}

/**
 * Só aceita caminhos internos ("/checkout/address"), nunca "//site.com" ou
 * "https://...", para o `?retorno=` não virar redirecionamento para fora da loja.
 */
export function retornoSeguro(valor: string | null): string | null {
  return valor && /^\/(?![/\\])/.test(valor) ? valor : null;
}

/** Mensagem do back (`{ error }`) ou uma genérica quando o Node não respondeu. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.';
    }
    const mensagem = (erro.error as { error?: unknown } | null)?.error;
    if (typeof mensagem === 'string' && mensagem) {
      return mensagem;
    }
  }
  return padrao;
}
