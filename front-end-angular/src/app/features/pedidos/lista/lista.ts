import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DataPipe, MoedaPipe } from '../../../shared/formatacao/formatacao';
import { codigoPedido, ResumoPedido } from '../pedido.model';
import { PedidosService } from '../pedidos.service';
import { StatusPedidoComponent } from '../status-pedido/status-pedido';

@Component({
  selector: 'app-lista',
  imports: [RouterLink, StatusPedidoComponent, MoedaPipe, DataPipe],
  templateUrl: './lista.html',
  styleUrl: './lista.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lista {
  private readonly pedidosService = inject(PedidosService);

  protected readonly pedidos = signal<ResumoPedido[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly codigo = codigoPedido;

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
