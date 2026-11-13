import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Linha "1 Carrinho — 2 Endereço — 3 Pagamento — 4 Confirmação" do checkout. */
@Component({
  selector: 'app-etapas-checkout',
  templateUrl: './etapas-checkout.html',
  styleUrl: './etapas-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtapasCheckout {
  /** Etapa atual, de 1 a 4. */
  readonly atual = input.required<number>();

  protected readonly etapas = ['Carrinho', 'Endereço', 'Pagamento', 'Confirmação'];
}
