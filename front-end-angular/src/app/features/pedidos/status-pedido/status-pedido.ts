import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROTULO_STATUS_PEDIDO, StatusPedido } from '../pedido.model';

/** Selo colorido do status do pedido (cores do protótipo Achei). */
@Component({
  selector: 'app-status-pedido',
  template: `<span class="selo selo--{{ classe() }}">{{ rotulo() }}</span>`,
  styles: `
    .selo {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .selo--pending {
      background: var(--achei-maracuja);
      color: var(--achei-cacau);
    }
    .selo--paid {
      background: var(--achei-mata-claro);
      color: var(--achei-mata);
    }
    .selo--processing {
      background: var(--achei-urucum-claro);
      color: var(--achei-cacau);
    }
    .selo--shipped {
      background: var(--achei-urucum-claro);
      color: var(--achei-cacau);
      box-shadow: inset 0 0 0 1.5px var(--achei-urucum);
    }
    .selo--delivered {
      background: var(--achei-mata);
      color: #fff;
    }
    .selo--canceled,
    .selo--refunded {
      background: var(--achei-erro-claro);
      color: var(--achei-erro);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPedidoComponent {
  readonly status = input.required<StatusPedido>();

  protected readonly rotulo = computed(() => ROTULO_STATUS_PEDIDO[this.status()]);
  protected readonly classe = computed(() => this.status().toLowerCase());
}
