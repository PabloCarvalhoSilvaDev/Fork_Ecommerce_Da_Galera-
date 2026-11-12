import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

type DocumentType = 'cpf' | 'cnpj';
type RegistrationField =
  'fullName' | 'email' | 'password' | 'confirmPassword' | 'documentNumber' | 'phone';

interface PasswordRules {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

interface ApiErrorResponse {
  error: string;
  field?: string;
}

interface RegistrationResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return !confirmPassword || password === confirmPassword ? null : { passwordMismatch: true };
};

const passwordByteLengthValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return new TextEncoder().encode(value).length <= 72 ? null : { maxPasswordBytes: true };
};

function getPasswordRules(value: string): PasswordRules {
  return {
    minLength: value.length >= 8,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9\s]/.test(value),
  };
}

const passwordRequirementsValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  return Object.values(getPasswordRules(value)).every(Boolean)
    ? null
    : { passwordRequirements: true };
};

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string' &&
    (!('field' in value) || typeof value.field === 'string')
  );
}

@Component({
  selector: 'app-cadastro-cliente',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro-cliente.html',
  styleUrl: './cadastro-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroCliente {
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  documentType: DocumentType = 'cpf';
  passwordVisible = false;
  confirmPasswordVisible = false;
  submitted = false;
  submitting = false;
  registrationComplete = false;
  errorMessage: string | null = null;

  get passwordRules(): PasswordRules {
    return getPasswordRules(this.form.controls.password.value);
  }

  private readonly documentNumberValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const digits = String(control.value ?? '').replace(/\D/g, '');
    if (!digits) {
      return null;
    }

    const expectedLength = this.documentType === 'cpf' ? 11 : 14;
    return digits.length === expectedLength ? null : { documentNumberLength: true };
  };

  readonly form = this.formBuilder.nonNullable.group(
    {
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
          Validators.pattern(/^[\p{L}\p{M} ]+$/u),
        ],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          passwordRequirementsValidator,
          passwordByteLengthValidator,
        ],
      ],
      confirmPassword: ['', Validators.required],
      documentNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d+$/), this.documentNumberValidator],
      ],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]],
    },
    { validators: passwordMatchValidator },
  );

  constructor() {
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.email, 'emailAlreadyRegistered');
      this.errorMessage = null;
    });

    this.form.controls.documentNumber.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.clearServerError(this.form.controls.documentNumber, 'documentAlreadyRegistered'),
      );
  }

  get passwordsMatch(): boolean {
    const { password, confirmPassword } = this.form.controls;
    return confirmPassword.value.length > 0 && password.value === confirmPassword.value;
  }

  get confirmPasswordInvalid(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    const shouldShowError = confirmPassword.touched || this.submitted;

    return (
      this.fieldInvalid('confirmPassword') ||
      (this.form.hasError('passwordMismatch') && shouldShowError)
    );
  }

  fieldInvalid(field: RegistrationField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted);
  }

  sanitizeName(event: Event): void {
    this.sanitizeInput(
      event,
      (value) => value.replace(/[^\p{L}\p{M} ]/gu, ''),
      this.form.controls.fullName,
    );
  }

  sanitizeDigits(event: Event, field: 'documentNumber' | 'phone'): void {
    this.sanitizeInput(event, (value) => value.replace(/\D/g, ''), this.form.controls[field]);
  }

  setDocumentType(type: DocumentType): void {
    if (this.documentType === type) {
      return;
    }

    this.documentType = type;
    this.form.controls.documentNumber.reset('');
    this.form.controls.documentNumber.updateValueAndValidity();
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        console.log('[Cadastro] Envio recusado: formulário inválido.');
      }
      return;
    }

    const value = this.form.getRawValue();
    this.submitting = true;
    this.http
      .post<RegistrationResponse>('/auth/register', {
        ...value,
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        documentNumber: value.documentNumber.replace(/\D/g, ''),
        phone: value.phone.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.registrationComplete = true;
          console.log('[Cadastro] Cadastro concluído pelo servidor.');
        },
        error: (error: unknown) => this.handleRegistrationError(error),
      });
  }

  private handleRegistrationError(error: unknown): void {
    this.submitting = false;

    if (!(error instanceof HttpErrorResponse)) {
      this.errorMessage = 'Não foi possível concluir o cadastro. Tente novamente.';
      console.log('[Cadastro] Cadastro não concluído por erro inesperado.');
      return;
    }

    const response = isApiErrorResponse(error.error) ? error.error : null;
    if (error.status === 409 && response?.field === 'email') {
      console.log('[Cadastro] Cadastro recusado: e-mail já cadastrado.');
      this.form.controls.email.setErrors({
        ...this.form.controls.email.errors,
        emailAlreadyRegistered: true,
      });
      this.form.controls.email.markAsTouched();
      return;
    }

    if (error.status === 409 && response?.field === 'documentNumber') {
      console.log('[Cadastro] Cadastro recusado: documento já cadastrado.');
      this.form.controls.documentNumber.setErrors({
        ...this.form.controls.documentNumber.errors,
        documentAlreadyRegistered: true,
      });
      this.form.controls.documentNumber.markAsTouched();
      return;
    }

    console.log('[Cadastro] Cadastro recusado pelo servidor.', { status: error.status });
    this.errorMessage =
      response?.error ??
      (error.status === 0
        ? 'Não foi possível conectar ao servidor. Tente novamente.'
        : 'Não foi possível concluir o cadastro. Tente novamente.');
  }

  private clearServerError(control: AbstractControl, errorKey: string): void {
    if (!control.hasError(errorKey)) {
      return;
    }

    const errors = { ...control.errors };
    delete errors[errorKey];
    control.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  private sanitizeInput(
    event: Event,
    sanitize: (value: string) => string,
    control: AbstractControl,
  ): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const value = input.value;
    const cursor = input.selectionStart ?? value.length;
    const sanitizedValue = sanitize(value);
    if (value === sanitizedValue) {
      return;
    }

    const sanitizedCursor = sanitize(value.slice(0, cursor)).length;
    input.value = sanitizedValue;
    input.setSelectionRange(sanitizedCursor, sanitizedCursor);
    control.setValue(sanitizedValue);
  }
}
