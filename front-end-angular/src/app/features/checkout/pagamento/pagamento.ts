import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MoedaPipe } from '../../../shared/formatacao/formatacao';
import { MetodoPagamento } from '../../pedidos/pedido.model';
import { PagamentoService, ResumoCheckout } from './pagamento.service';

interface OpcaoPagamento {
  metodo: MetodoPagamento;
  titulo: string;
  descricao: string;
}

type CampoCartao = 'numero' | 'nome' | 'validade' | 'cvv';

function validadeCartao(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  const partes = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!partes) {
    return valor ? { validade: true } : null;
  }

  const mes = Number(partes[1]);
  const ano = 2000 + Number(partes[2]);
  if (mes < 1 || mes > 12) {
    return { validade: true };
  }

  const hoje = new Date();
  const vencida =
    ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1);
  return vencida ? { vencido: true } : null;
}

@Component({
  selector: 'app-pagamento',
  imports: [ReactiveFormsModule, RouterLink, MoedaPipe],
  templateUrl: './pagamento.html',
  styleUrl: './pagamento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagamento {
  private readonly pagamentoService = inject(PagamentoService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  /** Estável enquanto o cliente está nesta tela: reenvio não duplica pedido. */
  private readonly idempotencyKey = crypto.randomUUID();

  protected readonly opcoes: OpcaoPagamento[] = [
    { metodo: 'PIX', titulo: 'PIX', descricao: 'Código gerado na confirmação' },
    { metodo: 'CREDIT_CARD', titulo: 'Cartão de crédito', descricao: 'Aprovação na hora' },
    { metodo: 'BOLETO', titulo: 'Boleto', descricao: 'Compensa em até 3 dias úteis' },
  ];

  protected readonly resumo = signal<ResumoCheckout | null>(null);
  protected readonly metodo = signal<MetodoPagamento>('PIX');
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly pagaComCartao = computed(() => this.metodo() === 'CREDIT_CARD');

  protected readonly cepFormatado = computed(() =>
    (this.resumo()?.endereco.cep ?? '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
  );

  protected readonly cartao = this.formBuilder.nonNullable.group({
    numero: ['', [Validators.required, Validators.pattern(/^(\d{4} ){3}\d{4}$/)]],
    nome: ['', [Validators.required, Validators.minLength(3)]],
    validade: ['', [Validators.required, validadeCartao]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  constructor() {
    this.pagamentoService
      .obterResumo()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (resumo) => this.resumo.set(resumo),
        error: () => this.erro.set('Não foi possível carregar o resumo do pedido.'),
      });
  }

  protected escolher(metodo: MetodoPagamento): void {
    this.metodo.set(metodo);
    this.erro.set(null);
  }

  protected campoInvalido(campo: CampoCartao): boolean {
    const controle = this.cartao.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected formatarNumero(evento: Event): void {
    this.mascarar(evento, 'numero', (digitos) =>
      digitos.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    );
  }

  protected formatarValidade(evento: Event): void {
    this.mascarar(evento, 'validade', (digitos) => {
      const d = digitos.slice(0, 4);
      return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    });
  }

  protected formatarCvv(evento: Event): void {
    this.mascarar(evento, 'cvv', (digitos) => digitos.slice(0, 4));
  }

  protected finalizar(): void {
    this.enviado.set(true);
    this.erro.set(null);

    if (this.enviando() || !this.resumo()) {
      return;
    }

    if (this.pagaComCartao() && this.cartao.invalid) {
      this.cartao.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.pagamentoService
      .finalizar({ idempotencyKey: this.idempotencyKey, metodo: this.metodo() })
      .subscribe({
        next: (pedido) => {
          this.enviando.set(false);
          this.router.navigate(['/checkout/success', pedido.id]);
        },
        error: () => {
          this.enviando.set(false);
          this.erro.set('Não foi possível finalizar o pedido. Tente novamente.');
        },
      });
  }

  private mascarar(evento: Event, campo: CampoCartao, formatar: (digitos: string) => string): void {
    const entrada = evento.target;
    if (!(entrada instanceof HTMLInputElement)) {
      return;
    }
    const valor = formatar(entrada.value.replace(/\D/g, ''));
    entrada.value = valor;
    this.cartao.controls[campo].setValue(valor);
  }
}
