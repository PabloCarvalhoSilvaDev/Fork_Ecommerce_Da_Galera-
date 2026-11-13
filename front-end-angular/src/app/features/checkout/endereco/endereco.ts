import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EtapasCheckout } from '../../../shared/etapas-checkout/etapas-checkout';
import { CarrinhoService } from '../carrinho/carrinho.service';
import { ResumoCompra } from '../resumo-compra/resumo-compra';
import { EnderecoSalvo, EnderecosService } from './enderecos.service';

type CampoEndereco = 'cep' | 'rua' | 'numero' | 'bairro' | 'cidade' | 'uf';

const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

@Component({
  selector: 'app-endereco',
  imports: [ReactiveFormsModule, RouterLink, EtapasCheckout, ResumoCompra],
  templateUrl: './endereco.html',
  styleUrls: ['../../../shared/estilos/loja.css', './endereco.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Endereco {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly carrinho = inject(CarrinhoService);
  protected readonly enderecos = inject(EnderecosService);

  protected readonly ufs = UFS;
  protected readonly formularioAberto = signal(this.enderecos.enderecos().length === 0);
  protected readonly enviado = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    apelido: ['', Validators.maxLength(40)],
    cep: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{3}$/)]],
    rua: ['', [Validators.required, Validators.maxLength(120)]],
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    complemento: ['', Validators.maxLength(60)],
    bairro: ['', [Validators.required, Validators.maxLength(80)]],
    cidade: ['', [Validators.required, Validators.maxLength(80)]],
    uf: ['', Validators.required],
    padrao: [false],
  });

  protected linhaEndereco(endereco: EnderecoSalvo): string {
    const complemento = endereco.complemento ? ` — ${endereco.complemento}` : '';
    return `${endereco.rua}, ${endereco.numero}${complemento}`;
  }

  protected linhaCidade(endereco: EnderecoSalvo): string {
    const cep = endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    return `${endereco.bairro}, ${endereco.cidade} – ${endereco.uf} · CEP ${cep}`;
  }

  protected campoInvalido(campo: CampoEndereco): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected formatarCep(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const digitos = entrada.value.replace(/\D/g, '').slice(0, 8);
    const valor = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    entrada.value = valor;
    this.form.controls.cep.setValue(valor);
  }

  protected salvar(): void {
    this.enviado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { padrao, apelido, complemento, cep, ...resto } = this.form.getRawValue();
    this.enderecos.adicionar(
      {
        ...resto,
        apelido: apelido.trim() || undefined,
        complemento: complemento.trim() || undefined,
        cep: cep.replace(/\D/g, ''),
      },
      padrao,
    );
    this.form.reset();
    this.enviado.set(false);
    this.formularioAberto.set(false);
  }
}
