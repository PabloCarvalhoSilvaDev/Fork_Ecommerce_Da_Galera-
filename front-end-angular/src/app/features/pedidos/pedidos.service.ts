import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Pedido, ResumoPedido } from './pedido.model';

/**
 * Pedidos do cliente logado.
 *
 * TODO: trocar o mock pelas chamadas ao serviço Java quando ele existir
 * (`GET /api/v1/orders` e `GET /api/v1/orders/:id`, com o Bearer do Node).
 * O formato dos dados já segue `ecommerce.orders`/`order_items`/`payments`.
 */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  /** Pedidos feitos no checkout do mock; ficam no navegador para sobreviver ao F5. */
  private readonly criados: Pedido[] = lerPedidosCriados();

  listar(): Observable<ResumoPedido[]> {
    const resumos = this.todos().map((pedido) => ({
      id: pedido.id,
      criadoEm: pedido.criadoEm,
      status: pedido.status,
      quantidadeItens: pedido.itens.reduce((soma, item) => soma + item.quantidade, 0),
      total: pedido.total,
      itens: pedido.itens.map(({ produtoId, nome, quantidade }) => ({
        produtoId,
        nome,
        quantidade,
      })),
    }));
    return of(resumos).pipe(delay(LATENCIA_MOCK_MS));
  }

  /**
   * Só para o mock: o pedido finalizado no checkout aparece em "Meus pedidos".
   * Com o Java, quem cria o pedido é o `POST /api/v1/orders`.
   */
  registrar(pedido: Pedido): void {
    this.criados.unshift(pedido);
    try {
      localStorage.setItem(CHAVE_PEDIDOS_CRIADOS, JSON.stringify(this.criados));
    } catch {
      // Armazenamento bloqueado: o pedido aparece só até recarregar a página.
    }
  }

  buscar(id: string): Observable<Pedido> {
    const pedido = this.todos().find((p) => p.id === id);
    return pedido
      ? of(pedido).pipe(delay(LATENCIA_MOCK_MS))
      : throwError(() => new PedidoNaoEncontradoError(id));
  }

  private todos(): Pedido[] {
    return [...this.criados, ...PEDIDOS_MOCK];
  }
}

const CHAVE_PEDIDOS_CRIADOS = 'ecommerce.pedidos-mock';

function lerPedidosCriados(): Pedido[] {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS_CRIADOS) ?? '[]');
    return Array.isArray(salvos) ? (salvos as Pedido[]) : [];
  } catch {
    return [];
  }
}

export class PedidoNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Pedido ${id} não encontrado`);
  }
}

const LATENCIA_MOCK_MS = 400;

const ENDERECO_CASA = {
  apelido: 'Casa',
  cep: '72000000',
  rua: 'Rua das Acácias',
  numero: '123',
  complemento: 'Apto 45',
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
};

const PEDIDOS_MOCK: Pedido[] = [
  {
    id: '9f3c2a10-4b7e-4c1a-9d2e-1a2b3c4d5e6f',
    criadoEm: '2026-11-09T18:20:00-03:00',
    status: 'PENDING',
    subtotal: 959.6,
    frete: 0,
    total: 959.6,
    itens: [
      {
        produtoId: 'p1',
        nome: 'Jogo de chaves combinadas 12 peças',
        sku: 'CHV-COMB-12',
        quantidade: 2,
        precoUnitario: 189.9,
      },
      {
        produtoId: 'p2',
        nome: 'Trena a laser 40 m',
        sku: 'TRN-LSR-40',
        quantidade: 1,
        precoUnitario: 289.9,
      },
      {
        produtoId: 'p3',
        nome: 'Esmerilhadeira angular 4½"',
        sku: 'ESM-ANG-115',
        quantidade: 1,
        precoUnitario: 289.9,
      },
    ],
    endereco: ENDERECO_CASA,
    pagamento: { metodo: 'PIX', status: 'PENDING' },
    historico: [{ status: 'PENDING', em: '2026-11-09T18:20:00-03:00' }],
  },
  {
    id: '4d81b6e2-0c55-4f0e-8a71-6b9c0d1e2f30',
    criadoEm: '2026-11-05T14:02:00-03:00',
    status: 'SHIPPED',
    subtotal: 389.9,
    frete: 0,
    total: 389.9,
    itens: [
      {
        produtoId: 'p4',
        nome: 'Furadeira de impacto 650W',
        sku: 'FUR-650-IMP',
        quantidade: 1,
        precoUnitario: 389.9,
      },
    ],
    endereco: ENDERECO_CASA,
    pagamento: { metodo: 'CREDIT_CARD', status: 'APPROVED' },
    historico: [
      { status: 'PENDING', em: '2026-11-05T14:02:00-03:00' },
      { status: 'PAID', em: '2026-11-05T14:03:00-03:00' },
      { status: 'PROCESSING', em: '2026-11-06T09:40:00-03:00' },
      { status: 'SHIPPED', em: '2026-11-09T22:10:00-03:00' },
    ],
  },
  {
    id: 'b27e9c44-8f13-4a6d-b5c2-7e8f9a0b1c2d',
    criadoEm: '2026-10-28T10:15:00-03:00',
    status: 'PROCESSING',
    subtotal: 499.8,
    frete: 20,
    total: 519.8,
    itens: [
      {
        produtoId: 'p5',
        nome: 'Serra tico-tico 500W',
        sku: 'SRR-TT-500',
        quantidade: 1,
        precoUnitario: 299.9,
      },
      {
        produtoId: 'p6',
        nome: 'Kit de lâminas para madeira',
        sku: 'LAM-MAD-KIT',
        quantidade: 1,
        precoUnitario: 199.9,
      },
    ],
    endereco: ENDERECO_CASA,
    pagamento: { metodo: 'BOLETO', status: 'APPROVED' },
    historico: [
      { status: 'PENDING', em: '2026-10-28T10:15:00-03:00' },
      { status: 'PAID', em: '2026-10-30T08:02:00-03:00' },
      { status: 'PROCESSING', em: '2026-10-30T15:30:00-03:00' },
    ],
  },
  {
    id: '0a6f5d38-2e91-47b3-a0c4-d5e6f7a8b9c0',
    criadoEm: '2026-10-15T09:00:00-03:00',
    status: 'DELIVERED',
    subtotal: 199,
    frete: 20,
    total: 219,
    itens: [
      {
        produtoId: 'p7',
        nome: 'Nível de bolha 60 cm',
        sku: 'NVL-BOL-60',
        quantidade: 1,
        precoUnitario: 199,
      },
    ],
    endereco: ENDERECO_CASA,
    pagamento: { metodo: 'PIX', status: 'APPROVED' },
    historico: [
      { status: 'PENDING', em: '2026-10-15T09:00:00-03:00' },
      { status: 'PAID', em: '2026-10-15T09:01:00-03:00' },
      { status: 'PROCESSING', em: '2026-10-15T13:20:00-03:00' },
      { status: 'SHIPPED', em: '2026-10-16T17:45:00-03:00' },
      { status: 'DELIVERED', em: '2026-10-18T11:10:00-03:00' },
    ],
  },
  {
    id: 'e5c1a7b9-6d24-4e8f-9b30-c1d2e3f4a5b6',
    criadoEm: '2026-10-02T20:40:00-03:00',
    status: 'CANCELED',
    subtotal: 592.7,
    frete: 20,
    total: 612.7,
    itens: [
      {
        produtoId: 'p8',
        nome: 'Parafusadeira 12V',
        sku: 'PAR-12V',
        quantidade: 1,
        precoUnitario: 349.9,
      },
      {
        produtoId: 'p9',
        nome: 'Caixa de brocas 30 peças',
        sku: 'BRC-30',
        quantidade: 2,
        precoUnitario: 121.4,
      },
    ],
    endereco: ENDERECO_CASA,
    pagamento: { metodo: 'BOLETO', status: 'PENDING' },
    historico: [
      { status: 'PENDING', em: '2026-10-02T20:40:00-03:00' },
      { status: 'CANCELED', em: '2026-10-06T00:00:00-03:00' },
    ],
  },
];
