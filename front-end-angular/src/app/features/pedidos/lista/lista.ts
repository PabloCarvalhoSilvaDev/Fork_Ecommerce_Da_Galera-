import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DataPipe, MoedaPipe } from '../../../shared/formatacao/formatacao';
import { codigoPedido, ResumoPedido } from '../pedido.model';
import { PedidosService } from '../pedidos.service';
import { StatusPedidoComponent } from '../status-pedido/status-pedido';

interface LinhaPedido extends ResumoPedido {
  codigo: string;
  /** Nome do 1º produto (o que aparece na tabela do desktop). */
  produtoPrincipal: string;
  /** "+ 2 outros itens", ou vazio quando só há um produto. */
  outrosItens: string;
}

@Component({
  selector: 'app-lista',
  imports: [RouterLink, StatusPedidoComponent, MoedaPipe, DataPipe],
  templateUrl: './lista.html',
  styleUrl: './lista.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lista {
  private readonly pedidosService = inject(PedidosService);

  private readonly pedidos = signal<ResumoPedido[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly linhas = computed<LinhaPedido[]>(() =>
    this.pedidos().map((pedido) => {
      const outros = pedido.itens.length - 1;
      return {
        ...pedido,
        codigo: codigoPedido(pedido.id),
        produtoPrincipal: pedido.itens[0]?.nome ?? 'Pedido sem itens',
        outrosItens:
          outros > 0 ? `+ ${outros} ${outros === 1 ? 'outro item' : 'outros itens'}` : '',
      };
    }),
  );

  constructor() {
    this.pedidosService
      .listar()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set(true);
          this.carregando.set(false);
        },
      });
  }
}
