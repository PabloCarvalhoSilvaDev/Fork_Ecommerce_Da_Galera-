import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Categoria, Produto } from './produto.model';

/**
 * Catálogo da loja (vitrine, busca e detalhe).
 *
 * TODO: trocar o mock pelo endpoint de catálogo quando ele existir no back
 * (`ecommerce.products`/`categories`). Os campos já seguem o schema.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  listar(): Observable<Produto[]> {
    return of(PRODUTOS_MOCK).pipe(delay(LATENCIA_MOCK_MS));
  }

  buscarPorSlug(slug: string): Observable<Produto> {
    const produto = PRODUTOS_MOCK.find((p) => p.slug === slug);
    return produto
      ? of(produto).pipe(delay(LATENCIA_MOCK_MS))
      : throwError(() => new Error(`Produto ${slug} não encontrado`));
  }
}

/** Categorias da barra e dos filtros (TODO: virão do back junto com o catálogo). */
export const CATEGORIAS: readonly Categoria[] = [
  { slug: 'eletroportateis', nome: 'Eletroportáteis' },
  { slug: 'cozinha', nome: 'Cozinha', pai: 'eletroportateis' },
  { slug: 'climatizacao', nome: 'Climatização', pai: 'eletroportateis' },
  { slug: 'ferramentas', nome: 'Ferramentas' },
  { slug: 'limpeza', nome: 'Limpeza' },
  { slug: 'iluminacao', nome: 'Iluminação' },
];

export function buscarCategoria(slug: string | null | undefined): Categoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

/** A categoria e as filhas dela (filtrar "Eletroportáteis" traz Cozinha também). */
export function slugsDaCategoria(slug: string): string[] {
  return [slug, ...CATEGORIAS.filter((c) => c.pai === slug).map((c) => c.slug)];
}

/** Início › Pai › Categoria, para a trilha do detalhe do produto. */
export function trilhaDaCategoria(slug: string): Categoria[] {
  const trilha: Categoria[] = [];
  let atual = buscarCategoria(slug);
  while (atual) {
    trilha.unshift(atual);
    atual = buscarCategoria(atual.pai);
  }
  return trilha;
}

const LATENCIA_MOCK_MS = 300;

function produto(
  dados: Omit<Produto, 'id' | 'fichaTecnica'> & { ficha: [string, string][] },
): Produto {
  const { ficha, ...resto } = dados;
  return {
    ...resto,
    id: `prod-${dados.slug}`,
    fichaTecnica: [
      { rotulo: 'Voltagem', valor: dados.voltagem },
      ...ficha.map(([rotulo, valor]) => ({ rotulo, valor })),
      { rotulo: 'Cor', valor: dados.cor },
    ],
  };
}

const PRODUTOS_MOCK: Produto[] = [
  produto({
    slug: 'furadeira-de-impacto-650w',
    nome: 'Furadeira de impacto 650W',
    sku: 'FUR-650-IMP',
    preco: 389.9,
    categoria: 'ferramentas',
    oferta: false,
    estoque: 8,
    voltagem: '220v',
    cor: 'Azul',
    tamanho: 'Médio',
    ficha: [
      ['Potência', '650 W'],
      ['Mandril', '13 mm'],
    ],
  }),
  produto({
    slug: 'liquidificador-1200w',
    nome: 'Liquidificador 1200W',
    sku: 'LIQ-1200-PR',
    preco: 249.9,
    categoria: 'cozinha',
    oferta: true,
    estoque: 12,
    voltagem: '220v',
    cor: 'Preto',
    tamanho: 'Médio',
    ficha: [
      ['Potência', '1200 W'],
      ['Capacidade', '3 L'],
      ['Dimensões', '22 × 20 × 42 cm'],
      ['Velocidades', '12 + pulsar'],
    ],
  }),
  produto({
    slug: 'ventilador-de-coluna-40cm',
    nome: 'Ventilador de coluna 40cm',
    sku: 'VEN-40-COL',
    preco: 219,
    categoria: 'climatizacao',
    oferta: false,
    estoque: 5,
    voltagem: 'Bivolt',
    cor: 'Branco',
    tamanho: 'Grande',
    ficha: [
      ['Potência', '140 W'],
      ['Velocidades', '3'],
    ],
  }),
  produto({
    slug: 'air-fryer-4l',
    nome: 'Air fryer 4L',
    sku: 'AIR-4L-DIG',
    preco: 429.9,
    categoria: 'cozinha',
    oferta: true,
    estoque: 3,
    voltagem: '220v',
    cor: 'Preto',
    tamanho: 'Médio',
    ficha: [
      ['Potência', '1500 W'],
      ['Capacidade', '4 L'],
      ['Painel', 'Digital'],
    ],
  }),
  produto({
    slug: 'parafusadeira-12v',
    nome: 'Parafusadeira 12V',
    sku: 'PAR-12V-BIV',
    preco: 299.9,
    categoria: 'ferramentas',
    oferta: true,
    estoque: 10,
    voltagem: 'Bivolt',
    cor: 'Preto',
    tamanho: 'Compacto',
    ficha: [
      ['Bateria', '12 V, íon-lítio'],
      ['Torque', '20 Nm'],
    ],
  }),
  produto({
    slug: 'cafeteira-eletrica-30-xicaras',
    nome: 'Cafeteira elétrica 30 xícaras',
    sku: 'CAF-30-INOX',
    preco: 179.9,
    categoria: 'cozinha',
    oferta: false,
    estoque: 0,
    voltagem: '110v',
    cor: 'Inox',
    tamanho: 'Médio',
    ficha: [
      ['Potência', '800 W'],
      ['Capacidade', '1,5 L'],
    ],
  }),
  produto({
    slug: 'aspirador-vertical-2-em-1',
    nome: 'Aspirador vertical 2 em 1',
    sku: 'ASP-2EM1-V',
    preco: 359,
    categoria: 'limpeza',
    oferta: false,
    estoque: 6,
    voltagem: '220v',
    cor: 'Branco',
    tamanho: 'Grande',
    ficha: [
      ['Potência', '1250 W'],
      ['Reservatório', '0,8 L'],
    ],
  }),
  produto({
    slug: 'chaleira-eletrica-1-7l',
    nome: 'Chaleira elétrica 1,7L',
    sku: 'CHA-17-INOX',
    preco: 139.9,
    categoria: 'cozinha',
    oferta: false,
    estoque: 20,
    voltagem: '220v',
    cor: 'Inox',
    tamanho: 'Compacto',
    ficha: [
      ['Potência', '2200 W'],
      ['Capacidade', '1,7 L'],
    ],
  }),
  produto({
    slug: 'trena-a-laser-40m',
    nome: 'Trena a laser 40 m',
    sku: 'TRN-LSR-40',
    preco: 289.9,
    categoria: 'ferramentas',
    oferta: false,
    estoque: 4,
    voltagem: 'Bivolt',
    cor: 'Amarelo',
    tamanho: 'Compacto',
    ficha: [
      ['Alcance', '40 m'],
      ['Precisão', '± 2 mm'],
    ],
  }),
  produto({
    slug: 'luminaria-de-mesa-led',
    nome: 'Luminária de mesa LED',
    sku: 'LUM-LED-MESA',
    preco: 119.9,
    categoria: 'iluminacao',
    oferta: true,
    estoque: 15,
    voltagem: 'Bivolt',
    cor: 'Branco',
    tamanho: 'Compacto',
    ficha: [
      ['Potência', '7 W'],
      ['Temperatura de cor', '3000 K a 6500 K'],
    ],
  }),
];
