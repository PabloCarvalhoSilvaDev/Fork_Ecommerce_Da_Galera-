import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Sessao } from '../../../core/sessao/sessao';
import { RespostaSessao, mensagemDeErro, retornoSeguro } from '../acesso';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['../acesso.css', './login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessao = inject(Sessao);

  /** Para onde voltar depois de entrar (ex.: carrinho → entrega). */
  private readonly retorno = retornoSeguro(
    inject(ActivatedRoute).snapshot.queryParamMap.get('retorno'),
  );

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly senhaVisivel = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', Validators.required],
  });

  protected campoInvalido(campo: 'email' | 'password'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected entrar(): void {
    this.enviado.set(true);
    this.erro.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    const { email, password } = this.form.getRawValue();
    this.http
      .post<RespostaSessao>('/auth/login', { email: email.trim().toLowerCase(), password })
      .subscribe({
        next: ({ token, user, redirectTo }) => {
          this.sessao.iniciar(token, user);
          // Cliente volta para onde estava; admin passa pela escolha de contexto.
          const destino = user.role === 'CLIENTE' ? (this.retorno ?? redirectTo) : redirectTo;
          this.router.navigateByUrl(destino);
        },
        error: (erro: unknown) => {
          this.enviando.set(false);
          this.erro.set(mensagemDeErro(erro, 'Não foi possível entrar. Tente novamente.'));
        },
      });
  }
}
