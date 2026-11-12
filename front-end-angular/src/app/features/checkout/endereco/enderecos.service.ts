import { Injectable, computed, signal } from '@angular/core';
import { EnderecoEntrega } from '../../pedidos/pedido.model';

export interface EnderecoSalvo extends EnderecoEntrega {
  id: string;
  padrao: boolean;
}

/**
 * Endereços do cliente e o escolhido para esta compra.
 *
 * TODO: trocar o mock pelos endpoints de endereço (`ecommerce.addresses`)
 * quando existirem; hoje os novos endereços ficam só nesta aba.
 */
@Injectable({ providedIn: 'root' })
export class EnderecosService {
  private readonly lista = signal<EnderecoSalvo[]>(ENDERECOS_MOCK);
  private readonly escolhidoId = signal<string | null>(
    ENDERECOS_MOCK.find((e) => e.padrao)?.id ?? null,
  );

  readonly enderecos = this.lista.asReadonly();
  readonly selecionado = computed(
    () => this.lista().find((e) => e.id === this.escolhidoId()) ?? null,
  );

  selecionar(id: string): void {
    this.escolhidoId.set(id);
  }

  adicionar(endereco: EnderecoEntrega, padrao: boolean): EnderecoSalvo {
    const novo: EnderecoSalvo = { ...endereco, id: crypto.randomUUID(), padrao };
    this.lista.update((lista) => [
      ...(padrao ? lista.map((e) => ({ ...e, padrao: false })) : lista),
      novo,
    ]);
    this.escolhidoId.set(novo.id);
    return novo;
  }
}

const ENDERECOS_MOCK: EnderecoSalvo[] = [
  {
    id: 'end-casa',
    padrao: true,
    apelido: 'Casa',
    cep: '72000000',
    rua: 'Rua das Acácias',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'Brasília',
    uf: 'DF',
  },
  {
    id: 'end-trabalho',
    padrao: false,
    apelido: 'Trabalho',
    cep: '72870000',
    rua: 'Avenida Brasil',
    numero: '1000',
    complemento: 'Sala 210',
    bairro: 'Jardim América',
    cidade: 'Valparaíso de Goiás',
    uf: 'GO',
  },
];
