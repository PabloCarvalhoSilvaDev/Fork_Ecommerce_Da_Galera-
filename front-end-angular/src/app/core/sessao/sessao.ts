import { Injectable, computed, signal } from '@angular/core';

export interface UsuarioSessao {
  id: string;
  fullName: string;
  email: string;
  role: 'CLIENTE' | 'ADMIN';
}

interface SessaoSalva {
  token: string;
  usuario: UsuarioSessao;
}

const CHAVE_ARMAZENAMENTO = 'ecommerce.sessao';

/**
 * Sessão do usuário logado: token JWT do Node + dados básicos do usuário.
 * Guardada no localStorage para sobreviver ao recarregar a página.
 * Cadastro e login chamam `iniciar`; o logout deve chamar `encerrar`.
 */
@Injectable({ providedIn: 'root' })
export class Sessao {
  private readonly sessao = signal<SessaoSalva | null>(lerSessaoSalva());

  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly token = computed(() => this.sessao()?.token ?? null);
  readonly logado = computed(() => this.sessao() !== null);

  iniciar(token: string, usuario: UsuarioSessao): void {
    const sessao = { token, usuario };
    this.sessao.set(sessao);
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao));
    } catch {
      // Navegação privada/armazenamento bloqueado: a sessão vale só nesta aba.
    }
  }

  encerrar(): void {
    this.sessao.set(null);
    try {
      localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    } catch {
      // Ignorado pelo mesmo motivo acima.
    }
  }
}

function lerSessaoSalva(): SessaoSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) {
      return null;
    }
    const sessao = JSON.parse(bruto) as Partial<SessaoSalva>;
    if (!sessao.token || !sessao.usuario?.fullName || tokenExpirado(sessao.token)) {
      return null;
    }
    return sessao as SessaoSalva;
  } catch {
    return null;
  }
}

/** Lê o `exp` do JWT só para descartar sessão vencida (a validação real é no back). */
function tokenExpirado(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
