import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { EtapasCheckout } from '../../../shared/etapas-checkout/etapas-checkout';
import { MoedaPipe } from '../../../shared/formatacao/formatacao';
import { Pedido, codigoPedido } from '../../pedidos/pedido.model';
import { PedidosService } from '../../pedidos/pedidos.service';
import { StatusPedidoComponent } from '../../pedidos/status-pedido/status-pedido';

const LADO_QR = 21;

/** Número determinístico a partir do id, para o QR ilustrativo não mudar a cada render. */
function semente(texto: string): number {
  let hash = 2166136261;
  for (const letra of texto) {
    hash = Math.imul(hash ^ letra.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

/** É um "quadrado de localização" (cantos do QR)? */
function canto(linha: number, coluna: number): boolean {
  const ultimo = LADO_QR - 7;
  const dentro = (l: number, c: number) => l >= 0 && l < 7 && c >= 0 && c < 7;
  return dentro(linha, coluna) || dentro(linha, coluna - ultimo) || dentro(linha - ultimo, coluna);
}

function preenchidoNoCanto(linha: number, coluna: number): boolean {
  const l = linha % (LADO_QR - 7);
  const c = coluna % (LADO_QR - 7);
  const borda = l === 0 || l === 6 || c === 0 || c === 6;
  const miolo = l >= 2 && l <= 4 && c >= 2 && c <= 4;
  return borda || miolo;
}

@Component({
  selector: 'app-confirmacao',
  imports: [RouterLink, EtapasCheckout, MoedaPipe, StatusPedidoComponent],
  templateUrl: './confirmacao.html',
  styleUrls: ['../../../shared/estilos/loja.css', './confirmacao.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirmacao {
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly carregando = signal(true);
  protected readonly copiado = signal(false);

  protected readonly codigo = computed(() => codigoPedido(this.pedido()?.id ?? ''));

  protected readonly quantidadeItens = computed(
    () => this.pedido()?.itens.reduce((soma, item) => soma + item.quantidade, 0) ?? 0,
  );

  /**
   * Códigos de pagamento do mock (não pagam nada).
   * TODO: virão da resposta do `POST /api/v1/orders` do Java.
   */
  protected readonly codigoPagamento = computed(() => {
    const pedido = this.pedido();
    if (!pedido) {
      return '';
    }
    const numeros = String(semente(pedido.id)).padStart(10, '0');
    return pedido.pagamento.metodo === 'BOLETO'
      ? `23790.${numeros.slice(0, 5)} ${numeros.slice(5)}.000000 00000.000000 1 ${Math.round(pedido.total * 100)}`
      : `00020126580014BR.GOV.BCB.PIX0136${pedido.id}5204000053039865802BR6304${numeros.slice(0, 4)}`;
  });

  protected readonly quadradosQr = computed(() => {
    let estado = semente(this.pedido()?.id ?? '');
    const quadrados: boolean[] = [];
    for (let linha = 0; linha < LADO_QR; linha++) {
      for (let coluna = 0; coluna < LADO_QR; coluna++) {
        estado = (Math.imul(estado, 1103515245) + 12345) >>> 0;
        quadrados.push(
          canto(linha, coluna) ? preenchidoNoCanto(linha, coluna) : (estado >>> 16) % 2 === 0,
        );
      }
    }
    return quadrados;
  });

  constructor() {
    const pedidos = inject(PedidosService);
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('orderId') ?? ''),
        switchMap((id) => pedidos.buscar(id).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((pedido) => {
        this.pedido.set(pedido);
        this.carregando.set(false);
      });
  }

  protected copiar(): void {
    navigator.clipboard?.writeText(this.codigoPagamento()).then(
      () => {
        this.copiado.set(true);
        setTimeout(() => this.copiado.set(false), 2500);
      },
      () => this.copiado.set(false),
    );
  }
}
