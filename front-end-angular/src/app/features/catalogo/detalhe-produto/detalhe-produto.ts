import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { MoedaPipe } from '../../../shared/formatacao/formatacao';
import { CarrinhoService } from '../../checkout/carrinho/carrinho.service';
import { CatalogoService, trilhaDaCategoria } from '../catalogo.service';
import { Produto } from '../produto.model';

@Component({
  selector: 'app-detalhe-produto',
  imports: [RouterLink, MoedaPipe],
  templateUrl: './detalhe-produto.html',
  styleUrls: ['../../../shared/estilos/loja.css', './detalhe-produto.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalheProduto {
  private readonly catalogo = inject(CatalogoService);
  private readonly carrinho = inject(CarrinhoService);
  private readonly router = inject(Router);

  protected readonly produto = signal<Produto | null>(null);
  protected readonly carregando = signal(true);
  protected readonly quantidade = signal(1);

  protected readonly trilha = computed(() => {
    const produto = this.produto();
    return produto ? trilhaDaCategoria(produto.categoria) : [];
  });

  protected readonly esgotado = computed(() => (this.produto()?.estoque ?? 0) === 0);

  /** Quanto ainda dá para pôr no carrinho, descontando o que já está lá. */
  protected readonly disponivel = computed(() => {
    const produto = this.produto();
    if (!produto) {
      return 0;
    }
    const noCarrinho =
      this.carrinho.itens().find((item) => item.produtoId === produto.id)?.quantidade ?? 0;
    return Math.max(produto.estoque - noCarrinho, 0);
  });

  protected readonly rotuloEstoque = computed(() => {
    const estoque = this.produto()?.estoque ?? 0;
    return `Em estoque · ${estoque} ${estoque === 1 ? 'disponível' : 'disponíveis'}`;
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('slug') ?? ''),
        tap(() => {
          this.carregando.set(true);
          this.quantidade.set(1);
        }),
        switchMap((slug) => this.catalogo.buscarPorSlug(slug).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((produto) => {
        this.produto.set(produto);
        this.carregando.set(false);
      });
  }

  protected alterarQuantidade(delta: number): void {
    const maximo = Math.max(this.disponivel(), 1);
    this.quantidade.update((atual) => Math.min(Math.max(atual + delta, 1), maximo));
  }

  protected adicionar(): void {
    const produto = this.produto();
    if (!produto || this.disponivel() === 0) {
      return;
    }
    this.carrinho.adicionar(produto, Math.min(this.quantidade(), this.disponivel()));
    this.router.navigate(['/checkout/cart']);
  }
}
