import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-autenticacao',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './autenticacao.html',
  styleUrl: './autenticacao.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Autenticacao {}
