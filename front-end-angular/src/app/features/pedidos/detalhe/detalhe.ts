import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { DataPipe, MoedaPipe } from '../../../shared/formatacao/formatacao';
import {
  codigoPedido,
  ETAPAS_PEDIDO,
  Pedido,
  ROTULO_METODO_PAGAMENTO,
  ROTULO_STATUS_PAGAMENTO,
  ROTULO_STATUS_PEDIDO,
  StatusPedido,
} from '../pedido.model';
import { PedidosService } from '../pedidos.service';
import { StatusPedidoComponent } from '../status-pedido/status-pedido';

interface EtapaLinhaDoTempo {
  status: StatusPedido;
  rotulo: string;
  em: string | null;
  concluida: boolean;
  atual: boolean;
}

@Component({
  selector: 'app-detalhe',
  imports: [RouterLink, StatusPedidoComponent, MoedaPipe, DataPipe],
  templateUrl: './detalhe.html',
  styleUrl: './detalhe.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detalhe {
  private readonly pedidosService = inject(PedidosService);

  private readonly rota = inject(ActivatedRoute);

  /** Parâmetro de rota `:orderId` (UUID do pedido). */
  private readonly id = signal('');

  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly codigo = computed(() => codigoPedido(this.id()));

  protected readonly encerradoSemEntrega = computed(() => {
    const status = this.pedido()?.status;
    return status === 'CANCELED' || status === 'REFUNDED';
  });

  protected readonly linhaDoTempo = computed<EtapaLinhaDoTempo[]>(() => {
    const pedido = this.pedido();
    if (!pedido) {
      return [];
    }

    const indiceAtual = ETAPAS_PEDIDO.indexOf(pedido.status);
    return ETAPAS_PEDIDO.map((status, indice) => ({
      status,
      rotulo: ROTULO_STATUS_PEDIDO[status],
      em: pedido.historico.find((evento) => evento.status === status)?.em ?? null,
      concluida: indiceAtual >= 0 && indice <= indiceAtual,
      atual: indice === indiceAtual,
    }));
  });

  protected readonly mensagemEncerramento = computed(() => {
    const pedido = this.pedido();
    if (!pedido || !this.encerradoSemEntrega()) {
      return '';
    }
    const acao = pedido.status === 'CANCELED' ? 'cancelado' : 'estornado';
    const evento = pedido.historico.find((e) => e.status === pedido.status);
    const quando = evento ? ` em ${new DataPipe().transform(evento.em)}` : '';
    return `Este pedido foi ${acao}${quando}.`;
  });

  protected readonly pagamentoDescricao = computed(() => {
    const pagamento = this.pedido()?.pagamento;
    return pagamento
      ? `${ROTULO_METODO_PAGAMENTO[pagamento.metodo]} · ${ROTULO_STATUS_PAGAMENTO[pagamento.status]}`
      : '';
  });

  protected readonly cepFormatado = computed(() => {
    const cep = this.pedido()?.endereco.cep ?? '';
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  });

  constructor() {
    this.rota.paramMap
      .pipe(
        map((parametros) => parametros.get('orderId') ?? ''),
        tap((id) => {
          this.id.set(id);
          this.carregando.set(true);
          this.erro.set(false);
        }),
        // catchError por dentro: um pedido não encontrado não pode matar o
        // paramMap, senão trocar de id na mesma tela para de carregar.
        switchMap((id) => this.pedidosService.buscar(id).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((pedido) => {
        this.pedido.set(pedido);
        this.erro.set(pedido === null);
        this.carregando.set(false);
      });
  }
}
