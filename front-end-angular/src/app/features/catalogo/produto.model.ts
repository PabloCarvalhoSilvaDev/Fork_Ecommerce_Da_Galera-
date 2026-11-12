/** Espelha `ecommerce.categories` (slug em minúsculas e hífen). */
export interface Categoria {
  slug: string;
  nome: string;
  /** Slug da categoria pai; ausente nas categorias raiz. */
  pai?: string;
}

export type Voltagem = '110v' | '220v' | 'Bivolt';
export type Tamanho = 'Compacto' | 'Médio' | 'Grande';

export interface CaracteristicaProduto {
  rotulo: string;
  valor: string;
}

/** Espelha `ecommerce.products` + o estoque disponível. */
export interface Produto {
  id: string;
  slug: string;
  nome: string;
  sku: string;
  preco: number;
  categoria: string;
  oferta: boolean;
  estoque: number;
  voltagem: Voltagem;
  cor: string;
  tamanho: Tamanho;
  fichaTecnica: CaracteristicaProduto[];
}
