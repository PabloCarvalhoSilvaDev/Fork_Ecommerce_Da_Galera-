import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-principal',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './principal.html',
  styleUrl: './principal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Principal {
  protected readonly nomeUsuario = 'Pablo Carvalho Silva';
}
