import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Sessao } from '../../core/sessao/sessao';
import { CarrinhoService } from '../../features/checkout/carrinho/carrinho.service';

/** Cabeçalho da loja: marca, busca e ações da conta (protótipo Achei). */
@Component({
  selector: 'app-cabecalho',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cabecalho {
  private readonly sessao = inject(Sessao);
  private readonly router = inject(Router);

  protected readonly logado = this.sessao.logado;

  protected readonly primeiroNome = computed(
    () => this.sessao.usuario()?.fullName.trim().split(/\s+/)[0] ?? '',
  );

  protected readonly itensCarrinho = inject(CarrinhoService).quantidadeItens;

  protected readonly rotuloCarrinho = computed(() => {
    const total = this.itensCarrinho();
    return `Carrinho, ${total} ${total === 1 ? 'item' : 'itens'}`;
  });

  protected readonly saindo = signal(false);

  protected buscar(evento: Event, termo: string): void {
    evento.preventDefault();
    const q = termo.trim();
    this.router.navigate(['/catalog/search'], { queryParams: q ? { q } : {} });
  }

  protected sair(): void {
    if (this.saindo()) {
      return;
    }
    this.saindo.set(true);
    this.sessao.sair().subscribe(() => {
      this.saindo.set(false);
      // Mesmo destino que o back devolve no logout (redirectTo).
      this.router.navigate(['/auth/login']);
    });
  }
}
