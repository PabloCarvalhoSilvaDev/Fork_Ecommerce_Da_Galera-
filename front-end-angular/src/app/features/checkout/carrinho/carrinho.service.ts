import { Injectable, computed, signal } from '@angular/core';
import { Produto } from '../../catalogo/produto.model';

export interface ItemCarrinho {
  produtoId: string;
  slug: string;
  nome: string;
  sku: string;
  /** Congelado quando o item entra no carrinho (regra do protótipo). */
  precoUnitario: number;
  quantidade: number;
  /** Limite do seletor de quantidade. */
  estoque: number;
}

const CHAVE_ARMAZENAMENTO = 'ecommerce.carrinho';

/**
 * Carrinho do cliente. Fica no Angular (localStorage) até o checkout;
 * o pedido só é criado no Java ao finalizar o pagamento (SRS 4.3).
 */
@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private readonly estado = signal<ItemCarrinho[]>(lerCarrinhoSalvo());

  readonly itens = this.estado.asReadonly();
  readonly quantidadeItens = computed(() =>
    this.estado().reduce((soma, item) => soma + item.quantidade, 0),
  );
  readonly subtotal = computed(() =>
    arredondar(
      this.estado().reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0),
    ),
  );
  readonly vazio = computed(() => this.estado().length === 0);

  adicionar(produto: Produto, quantidade: number): void {
    const existente = this.estado().find((item) => item.produtoId === produto.id);
    if (existente) {
      this.alterarQuantidade(produto.id, existente.quantidade + quantidade);
      return;
    }
    this.salvar([
      ...this.estado(),
      {
        produtoId: produto.id,
        slug: produto.slug,
        nome: produto.nome,
        sku: produto.sku,
        precoUnitario: produto.preco,
        quantidade: limitar(quantidade, produto.estoque),
        estoque: produto.estoque,
      },
    ]);
  }

  alterarQuantidade(produtoId: string, quantidade: number): void {
    this.salvar(
      this.estado().map((item) =>
        item.produtoId === produtoId
          ? { ...item, quantidade: limitar(quantidade, item.estoque) }
          : item,
      ),
    );
  }

  remover(produtoId: string): void {
    this.salvar(this.estado().filter((item) => item.produtoId !== produtoId));
  }

  limpar(): void {
    this.salvar([]);
  }

  private salvar(itens: ItemCarrinho[]): void {
    this.estado.set(itens);
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(itens));
    } catch {
      // Armazenamento bloqueado: o carrinho vale só enquanto a aba estiver aberta.
    }
  }
}

function limitar(quantidade: number, estoque: number): number {
  return Math.max(1, Math.min(Math.floor(quantidade), Math.max(estoque, 1)));
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function lerCarrinhoSalvo(): ItemCarrinho[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) ?? '[]');
    return Array.isArray(salvo) ? (salvo as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}
