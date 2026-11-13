import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../acesso';

@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.html',
  styleUrls: ['../acesso.css', './esqueci-senha.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsqueciSenha {
  private readonly http = inject(HttpClient);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** Mensagem genérica do back: não revela se o e-mail existe. */
  protected readonly confirmacao = signal<string | null>(null);

  protected readonly email = inject(FormBuilder).nonNullable.control('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(254),
  ]);

  protected get emailInvalido(): boolean {
    return this.email.invalid && (this.email.touched || this.enviado());
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.enviado.set(true);
    this.erro.set(null);
    if (this.email.invalid || this.enviando()) {
      this.email.markAsTouched();
      return;
    }

    this.enviando.set(true);
    this.http
      .post<{ message: string }>('/auth/forgot', { email: this.email.value.trim().toLowerCase() })
      .subscribe({
        next: ({ message }) => {
          this.enviando.set(false);
          this.confirmacao.set(message);
        },
        error: (erro: unknown) => {
          this.enviando.set(false);
          this.erro.set(mensagemDeErro(erro, 'Não foi possível enviar o link. Tente novamente.'));
        },
      });
  }
}
