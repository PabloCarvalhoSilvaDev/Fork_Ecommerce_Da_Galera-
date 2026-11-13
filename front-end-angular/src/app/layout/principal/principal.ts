import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraCategorias } from '../barra-categorias/barra-categorias';
import { Cabecalho } from '../cabecalho/cabecalho';

@Component({
  selector: 'app-principal',
  imports: [RouterOutlet, Cabecalho, BarraCategorias],
  templateUrl: './principal.html',
  styleUrl: './principal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Principal {}
