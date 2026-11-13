import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MoedaPipe } from '../../../shared/formatacao/formatacao';
import { FRETE_GRATIS_A_PARTIR_DE } from '../../checkout/frete';
import { CartaoProduto } from '../cartao-produto/cartao-produto';
import { CatalogoService } from '../catalogo.service';
import { Produto } from '../produto.model';

@Component({
  selector: 'app-vitrine',
  imports: [RouterLink, CartaoProduto, MoedaPipe],
  templateUrl: './vitrine.html',
  styleUrls: ['../../../shared/estilos/loja.css', './vitrine.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vitrine {
  protected readonly freteGratisAPartirDe = FRETE_GRATIS_A_PARTIR_DE;
  protected readonly destaques = signal<Produto[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  constructor() {
    inject(CatalogoService)
      .listar({ limit: 8 })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (produtos) => {
          this.destaques.set(produtos);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set(true);
          this.carregando.set(false);
        },
      });
  }
}
