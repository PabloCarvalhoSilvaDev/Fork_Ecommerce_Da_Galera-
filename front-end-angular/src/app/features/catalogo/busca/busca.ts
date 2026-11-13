import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CartaoProduto } from '../cartao-produto/cartao-produto';
import {
  CatalogoService,
  FiltrosCatalogo,
  buscarCategoria,
  slugsDaCategoria,
} from '../catalogo.service';
import { Categoria, Produto } from '../produto.model';

type Ordem = 'relevancia' | 'menor-preco' | 'maior-preco';
type GrupoFiltro = 'voltagem' | 'cor' | 'tamanho';

interface FiltroAtivo {
  rotulo: string;
  remover: () => void;
}

const VOLTAGENS = ['110v', '220v', 'Bivolt'];
const TAMANHOS = ['Compacto', 'Médio', 'Grande'];

/** Sem acento e minúsculo, para "climatizacao" achar "Climatização". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'app-busca',
  imports: [RouterLink, CartaoProduto],
  templateUrl: './busca.html',
  styleUrls: ['../../../shared/estilos/loja.css', './busca.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busca {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  private readonly parametros = toSignal(
    this.rota.queryParamMap.pipe(
      map((params) => ({
        termo: (params.get('q') ?? '').trim(),
        categoria: params.get('categoria'),
      })),
    ),
    { requireSync: true },
  );

  protected readonly termo = computed(() => this.parametros().termo);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly erroCategorias = signal(false);
  protected readonly categoria = computed(() =>
    buscarCategoria(this.parametros().categoria, this.categorias()),
  );
  protected readonly categoriasRaiz = computed(() =>
    this.categorias().filter((categoria) => !categoria.pai),
  );
  protected readonly subcategorias = (pai: string) =>
    this.categorias().filter((categoria) => categoria.pai === pai);

  private readonly produtos = signal<Produto[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly filtrosAbertos = signal(false);
  protected readonly ordem = signal<Ordem>('relevancia');

  protected readonly selecionados = {
    voltagem: signal<string[]>([]),
    cor: signal<string[]>([]),
    tamanho: signal<string[]>([]),
  };

  protected readonly opcoes = computed(() => ({
    voltagem: VOLTAGENS,
    cor: [
      ...new Set(this.produtos().flatMap((produto) => (produto.cor ? [produto.cor] : []))),
    ].sort(),
    tamanho: TAMANHOS,
  }));

  protected readonly grupos: { chave: GrupoFiltro; titulo: string }[] = [
    { chave: 'voltagem', titulo: 'Voltagem' },
    { chave: 'cor', titulo: 'Cor' },
    { chave: 'tamanho', titulo: 'Dimensões' },
  ];

  protected readonly resultados = computed(() => {
    const termo = normalizar(this.termo());
    const categoria = this.categoria();
    const slugs = categoria ? slugsDaCategoria(categoria.slug, this.categorias()) : null;
    const voltagens = this.selecionados.voltagem();
    const cores = this.selecionados.cor();
    const tamanhos = this.selecionados.tamanho();

    const filtrados = this.produtos().filter((p) => {
      const texto = normalizar(
        `${p.nome} ${p.sku} ${buscarCategoria(p.categoria, this.categorias())?.nome ?? ''}`,
      );
      return (
        (!termo || texto.includes(termo)) &&
        (!slugs || slugs.includes(p.categoria)) &&
        (!voltagens.length || (p.voltagem !== null && voltagens.includes(p.voltagem))) &&
        (!cores.length || (p.cor !== null && cores.includes(p.cor))) &&
        (!tamanhos.length || (p.tamanho !== null && tamanhos.includes(p.tamanho)))
      );
    });

    switch (this.ordem()) {
      case 'menor-preco':
        return [...filtrados].sort((a, b) => a.preco - b.preco);
      case 'maior-preco':
        return [...filtrados].sort((a, b) => b.preco - a.preco);
      default:
        return filtrados;
    }
  });

  protected readonly titulo = computed(() => {
    const termo = this.termo();
    if (termo) {
      return `Resultados para “${termo}”`;
    }
    return this.categoria()?.nome ?? 'Todos os produtos';
  });

  protected readonly filtrosAtivos = computed<FiltroAtivo[]>(() => {
    const ativos: FiltroAtivo[] = [];
    const termo = this.termo();
    const categoria = this.categoria();
    if (termo) {
      ativos.push({ rotulo: `“${termo}”`, remover: () => this.trocarParametro('q', null) });
    }
    if (categoria) {
      ativos.push({
        rotulo: categoria.nome,
        remover: () => this.trocarParametro('categoria', null),
      });
    }
    for (const { chave, titulo } of this.grupos) {
      for (const valor of this.selecionados[chave]()) {
        ativos.push({
          rotulo: `${titulo.toLowerCase()}: ${valor}`,
          remover: () => this.alternar(chave, valor),
        });
      }
    }
    return ativos;
  });

  constructor() {
    const catalogo = inject(CatalogoService);
    catalogo
      .listarCategorias()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: () => this.erroCategorias.set(true),
      });

    effect((onCleanup) => {
      const { termo, categoria } = this.parametros();
      const sort: FiltrosCatalogo['sort'] = (
        {
          relevancia: 'relevance',
          'menor-preco': 'price-asc',
          'maior-preco': 'price-desc',
        } as const
      )[this.ordem()];
      this.carregando.set(true);
      this.erro.set(false);

      const subscription = catalogo
        .listar({
          q: termo,
          category: categoria ?? undefined,
          sort,
        })
        .subscribe({
          next: (produtos) => {
            this.produtos.set(produtos);
            this.carregando.set(false);
          },
          error: () => {
            this.erro.set(true);
            this.carregando.set(false);
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected alternar(grupo: GrupoFiltro, valor: string): void {
    this.selecionados[grupo].update((lista) =>
      lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor],
    );
  }

  protected ordenar(evento: Event): void {
    this.ordem.set((evento.target as HTMLSelectElement).value as Ordem);
  }

  protected limparFiltros(): void {
    for (const { chave } of this.grupos) {
      this.selecionados[chave].set([]);
    }
    this.router.navigate([], { relativeTo: this.rota, queryParams: {} });
  }

  private trocarParametro(nome: 'q' | 'categoria', valor: string | null): void {
    this.router.navigate([], {
      relativeTo: this.rota,
      queryParams: { [nome]: valor },
      queryParamsHandling: 'merge',
    });
  }
}
