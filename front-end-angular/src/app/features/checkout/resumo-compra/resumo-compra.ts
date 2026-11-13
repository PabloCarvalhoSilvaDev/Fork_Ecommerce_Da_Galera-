import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MoedaPipe } from '../../../shared/formatacao/formatacao';
import { calcularFrete } from '../frete';

/**
 * Card "Resumo" do carrinho e do endereço. Os botões da etapa entram
 * como conteúdo: `<app-resumo-compra ...><a ...>Continuar</a></app-resumo-compra>`.
 */
@Component({
  selector: 'app-resumo-compra',
  imports: [MoedaPipe],
  templateUrl: './resumo-compra.html',
  styleUrl: './resumo-compra.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumoCompra {
  readonly quantidadeItens = input.required<number>();
  readonly subtotal = input.required<number>();

  protected readonly frete = computed(() => calcularFrete(this.subtotal()));
  protected readonly total = computed(() => this.subtotal() + this.frete());
}
