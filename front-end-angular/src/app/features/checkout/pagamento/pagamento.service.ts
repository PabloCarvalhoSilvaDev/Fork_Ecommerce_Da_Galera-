import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { EnderecoEntrega, MetodoPagamento, StatusPedido } from '../../pedidos/pedido.model';

export interface ResumoCheckout {
  quantidadeItens: number;
  subtotal: number;
  frete: number;
  total: number;
  endereco: EnderecoEntrega;
}

export interface NovoPedido {
  /** Gerada uma vez por tentativa; o Java deduplica por ela (SRS 4.3). */
  idempotencyKey: string;
  metodo: MetodoPagamento;
}

export interface PedidoCriado {
  id: string;
  status: StatusPedido;
}

/**
 * Fechamento do checkout.
 *
 * TODO: substituir o mock quando o serviço Java existir:
 * - resumo: virá do carrinho (Angular) + endereço escolhido em /endereco;
 * - finalizar: `POST /api/v1/orders` com os itens do carrinho e o método.
 * Dados do cartão não são enviados: o gateway é simulado no Java.
 */
@Injectable({ providedIn: 'root' })
export class PagamentoService {
  obterResumo(): Observable<ResumoCheckout> {
    return of(RESUMO_MOCK).pipe(delay(LATENCIA_MOCK_MS));
  }

  finalizar(pedido: NovoPedido): Observable<PedidoCriado> {
    // Regra do SRS: PIX/boleto ficam PENDING; cartão aprovado no mock vira PAID.
    const status: StatusPedido = pedido.metodo === 'CREDIT_CARD' ? 'PAID' : 'PENDING';
    return of({ id: crypto.randomUUID(), status }).pipe(delay(LATENCIA_MOCK_MS * 2));
  }
}

const LATENCIA_MOCK_MS = 400;

const RESUMO_MOCK: ResumoCheckout = {
  quantidadeItens: 4,
  subtotal: 959.6,
  frete: 0,
  total: 959.6,
  endereco: {
    apelido: 'Casa',
    cep: '72000000',
    rua: 'Rua das Acácias',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'Brasília',
    uf: 'DF',
  },
};
