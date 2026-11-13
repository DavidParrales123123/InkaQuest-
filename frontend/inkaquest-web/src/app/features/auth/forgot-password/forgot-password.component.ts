// @ts-nocheck
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/**
 * Recuperación de contraseña.
 *
 * <p>Por seguridad, el mensaje no revela si el correo está registrado.</p>
 */
@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="forgot-title">
      <div class="auth-panel">
        <a routerLink="/" class="auth-back" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Volver al inicio
        </a>
        <div class="auth-card">
          <a routerLink="/" class="auth-brand" aria-label="Ir al inicio de InkaQuest">
            <img src="/assets/images/brand/logo.png" alt="" width="40" height="40" />
            <span><strong>InkaQuest</strong><small>Recupera tu acceso</small></span>
          </a>

          <p class="auth-kicker">Seguridad de cuenta</p>
          <h1 id="forgot-title" class="auth-title">Recupera tu contraseña</h1>
          <p class="auth-subtitle">Escribe tu correo y te enviaremos un enlace para restablecerla.</p>

          <form class="auth-form" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="auth-field">
              <label for="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autocomplete="email"
                formControlName="email"
                placeholder="tu@universidad.edu.pe"
                [attr.aria-invalid]="campoInvalido() ? true : null"
                [class.border-danger-500]="campoInvalido()"
              />
              <p class="field-error" aria-live="polite">{{ campoInvalido() ? 'Introduce un correo electrónico válido.' : '\u00A0' }}</p>
            </div>

            <button class="auth-submit mt-1" type="submit" [disabled]="cargando()">
              {{ cargando() ? 'Enviando enlace…' : 'Enviar enlace de recuperación' }}
            </button>
          </form>

          @if (mensaje()) {
            <p class="auth-alert" [class.auth-success]="exito()" role="status">{{ mensaje() }}</p>
          }

          <div class="auth-footer">
            <p class="auth-switch">¿Recordaste tu contraseña? <a routerLink="/login">Iniciar sesión</a></p>
          </div>
        </div>
      </div>

      <aside class="auth-aside" aria-hidden="true">
        <div class="auth-aside__content">
          <p class="auth-aside__label">Acceso seguro</p>
          <h2>Te ayudamos a volver.</h2>
          <p>Recibirás instrucciones en tu correo si la cuenta existe. Revisa también tu bandeja de spam.</p>
          <div class="auth-aside__art">
            <img src="/assets/images/brand/logo.png" alt="" width="420" height="420" loading="lazy" />
          </div>
        </div>
      </aside>
    </section>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  /** Formulario reactivo. */
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /** Estado de carga. */
  protected readonly cargando = signal(false);
  /** Mensaje de resultado. */
  protected readonly mensaje = signal('');
  /** Indica si el mensaje es de exito. */
  protected readonly exito = signal(false);

  /** Indica si el correo es invalido y fue tocado. */
  protected campoInvalido(): boolean {
    const control = this.form.get('email');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Envia la solicitud de recuperacion. */
  protected async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    try {
      const resultado = await this.auth.recuperarContrasena(this.form.getRawValue().email);
      this.mensaje.set(resultado.mensaje);
      this.exito.set(resultado.ok);
    } finally {
      this.cargando.set(false);
    }
  }
}
