import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIAS } from '../../features/catalogo/catalogo.service';

/**
 * Barra de atalhos de categoria abaixo do cabeçalho (protótipo Achei).
 *
 * As categorias vêm do mock do catálogo (TODO: endpoint de `ecommerce.categories`).
 */
@Component({
  selector: 'app-barra-categorias',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-categorias.html',
  styleUrl: './barra-categorias.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraCategorias {
  protected readonly categorias = CATEGORIAS;
}
