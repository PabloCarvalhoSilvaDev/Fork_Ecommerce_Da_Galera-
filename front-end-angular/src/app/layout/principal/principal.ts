import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Sessao } from '../../core/sessao/sessao';

@Component({
  selector: 'app-principal',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './principal.html',
  styleUrl: './principal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Principal {
  private readonly sessao = inject(Sessao);

  protected readonly nomeUsuario = computed(() => this.sessao.usuario()?.fullName ?? null);
}
