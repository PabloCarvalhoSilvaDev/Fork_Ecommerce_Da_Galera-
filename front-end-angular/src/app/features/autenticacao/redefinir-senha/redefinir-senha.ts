import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensagemDeErro } from '../acesso';

/** Mesmas regras do `customerPasswordSchema` do Node. */
const REGRAS_SENHA: { rotulo: string; testar: (senha: string) => boolean }[] = [
  { rotulo: 'Pelo menos 8 caracteres', testar: (s) => s.length >= 8 },
  { rotulo: 'Uma letra minúscula', testar: (s) => /[a-z]/.test(s) },
  { rotulo: 'Uma letra maiúscula', testar: (s) => /[A-Z]/.test(s) },
  { rotulo: 'Um número', testar: (s) => /\d/.test(s) },
  { rotulo: 'Um caractere especial', testar: (s) => /[^A-Za-z0-9\s]/.test(s) },
];

function senhaForte(controle: AbstractControl): ValidationErrors | null {
  const senha = String(controle.value ?? '');
  if (new TextEncoder().encode(senha).length > 72) {
    return { senhaLonga: true };
  }
  return REGRAS_SENHA.every((regra) => regra.testar(senha)) ? null : { senhaFraca: true };
}

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const { password, confirmPassword } = grupo.value as Record<string, string>;
  return !confirmPassword || password === confirmPassword ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
  styleUrls: ['../acesso.css', './redefinir-senha.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedefinirSenha {
  private readonly http = inject(HttpClient);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly senhaVisivel = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** Token inválido/expirado: o back manda pedir um link novo. */
  protected readonly linkInvalido = signal(false);
  protected readonly concluido = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, senhaForte]],
      confirmPassword: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  private readonly senha = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  protected readonly regras = computed(() =>
    REGRAS_SENHA.map((regra) => ({ rotulo: regra.rotulo, ok: regra.testar(this.senha()) })),
  );

  protected campoInvalido(campo: 'password' | 'confirmPassword'): boolean {
    const controle = this.form.controls[campo];
    const mostrar = controle.touched || this.enviado();
    if (campo === 'confirmPassword') {
      return mostrar && (controle.invalid || this.form.hasError('senhasDiferentes'));
    }
    return mostrar && controle.invalid;
  }

  protected salvar(): void {
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
    this.http
      .post<{ message: string }>(
        `/auth/reset/${encodeURIComponent(this.token)}`,
        this.form.getRawValue(),
      )
      .subscribe({
        next: ({ message }) => {
          this.enviando.set(false);
          this.concluido.set(message);
        },
        error: (erro: unknown) => {
          this.enviando.set(false);
          const redirectTo =
            erro instanceof HttpErrorResponse
              ? (erro.error as { redirectTo?: string } | null)?.redirectTo
              : undefined;
          this.linkInvalido.set(redirectTo === '/auth/forgot');
          this.erro.set(mensagemDeErro(erro, 'Não foi possível salvar a senha. Tente novamente.'));
        },
      });
  }
}
