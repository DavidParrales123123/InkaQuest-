// @ts-nocheck
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { mensajeErrorContrasena, validarContrasenaSegura } from '../../../core/validators/contrasena.validator';

/**
 * Restablecimiento de contraseña.
 *
 * <p>Supabase Auth procesa el token de recuperación en la URL; esta pantalla
 * solicita la nueva contraseña al usuario autenticado por ese token.</p>
 */
@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="reset-title">
      <div class="auth-panel">
        <a routerLink="/" class="auth-back" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Volver al inicio
        </a>
        <div class="auth-card">
          <a routerLink="/" class="auth-brand" aria-label="Ir al inicio de InkaQuest">
            <img src="/assets/images/brand/logo.png" alt="" width="40" height="40" />
            <span><strong>InkaQuest</strong><small>Nueva contraseña</small></span>
          </a>

          <p class="auth-kicker">Seguridad de cuenta</p>
          <h1 id="reset-title" class="auth-title">Define tu nueva contraseña</h1>
          <p class="auth-subtitle">Elige una contraseña de al menos 8 caracteres con al menos una mayúscula y un símbolo.</p>

          @if (!tokenValido()) {
            <div class="auth-alert">
              <p class="font-bold">El enlace no es válido o ha expirado.</p>
              <p class="mt-1">Solicita un nuevo enlace de recuperación para continuar.</p>
            </div>
            <p class="auth-switch mt-4"><a routerLink="/recuperar-password">Solicitar nuevo enlace</a></p>
          } @else {
            <form class="auth-form" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
              <div class="auth-field">
                <label for="password">Nueva contraseña</label>
                <input id="password" type="password" autocomplete="new-password" formControlName="password" placeholder="Mínimo 8 caracteres, una mayúscula y un símbolo" [attr.aria-invalid]="campoInvalido('password') ? true : null" [class.border-danger-500]="campoInvalido('password')" />
                <p class="field-error" aria-live="polite">{{ campoInvalido('password') ? mensajeContrasena() : 'Mín. 8 caracteres · 1 mayúscula · 1 símbolo (!, @, #, $, …)' }}</p>
              </div>
              <div class="auth-field">
                <label for="confirmar">Repite la contraseña</label>
                <input id="confirmar" type="password" autocomplete="new-password" formControlName="confirmar" placeholder="Repite tu contraseña" [attr.aria-invalid]="campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched) ? true : null" [class.border-danger-500]="campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched)" />
                <p class="field-error" aria-live="polite">{{ (campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched)) ? (form.errors?.['contrasenas'] ? 'Las contraseñas no coinciden.' : 'Este campo es obligatorio.') : '\u00A0' }}</p>
              </div>
              <button class="auth-submit mt-1" type="submit" [disabled]="cargando()">
                {{ cargando() ? 'Guardando…' : 'Guardar nueva contraseña' }}
              </button>
            </form>

            @if (mensaje()) {
              <p class="auth-alert" [class.auth-success]="exito()" role="status">{{ mensaje() }}</p>
            }
          }

          <div class="auth-footer">
            <p class="auth-switch">¿Ya tienes acceso? <a routerLink="/login">Iniciar sesión</a></p>
          </div>
        </div>
      </div>

      <aside class="auth-aside" aria-hidden="true">
        <div class="auth-aside__content">
          <p class="auth-aside__label">Protege tu cuenta</p>
          <h2>Una contraseña segura.</h2>
          <p>Usa una combinación que no repitas en otros servicios para mantener tu progreso y datos protegidos.</p>
          <div class="auth-aside__art">
            <img src="/assets/images/brand/logo.png" alt="" width="420" height="420" loading="lazy" />
          </div>
        </div>
      </aside>
    </section>
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Formulario reactivo. */
  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), validarContrasenaSegura]],
      confirmar: ['', [Validators.required]],
    },
    { validators: [this.coincidenPasswords()] },
  );

  /** Estado de carga. */
  protected readonly cargando = signal(false);
  /** Mensaje de resultado. */
  protected readonly mensaje = signal('');
  /** Indica si el mensaje es de exito. */
  protected readonly exito = signal(false);
  /** Indica que hay una sesion de recuperacion valida. */
  protected readonly tokenValido = signal(true);

  /** Validador que comprueba que ambas contrasenas coinciden. */
  private coincidenPasswords() {
    return (grupo: { get(campo: string): { value: string } | null }): Record<string, boolean> | null => {
      const password = grupo.get('password')?.value;
      const confirmar = grupo.get('confirmar')?.value;
      if (!password || !confirmar) {
        return null;
      }
      return password === confirmar ? null : { contrasenas: true };
    };
  }

  /** Mensaje del primer error de la contraseña (o cadena vacía). */
  protected mensajeContrasena(): string {
    const control = this.form.get('password');
    if (!control?.errors) return '';
    for (const key of Object.keys(control.errors)) {
      const msg = mensajeErrorContrasena(key);
      if (msg) return msg;
    }
    return 'Revisa este campo.';
  }

  /** Indica si un control es invalido y fue tocado. */
  protected campoInvalido(nombre: string): boolean {
    const control = this.form.get(nombre);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Envia el formulario de restablecimiento. */
  protected async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    try {
      const resultado = await this.auth.actualizarContrasena(
        this.form.getRawValue().password,
      );
      this.mensaje.set(resultado.mensaje);
      this.exito.set(resultado.ok);

      if (resultado.ok) {
        await this.router.navigate(['/login']);
      }
    } finally {
      this.cargando.set(false);
    }
  }
}
