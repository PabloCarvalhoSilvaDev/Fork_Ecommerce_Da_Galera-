import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-autenticacao',
  imports: [RouterOutlet],
  templateUrl: './autenticacao.html',
  styleUrl: './autenticacao.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Autenticacao {}
