// @ts-nocheck
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/**
 * Inicio de sesión.
 *
 * <p>La autenticación la realiza Supabase Auth. El formulario valida la forma
 * y traduce errores; no gestiona tokens ni decide permisos.</p>
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="login-title">
      <div class="auth-panel">
        <a routerLink="/" class="auth-back" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Volver al inicio
        </a>
        <div class="auth-card">
          <a routerLink="/" class="auth-brand" aria-label="Ir al inicio de InkaQuest">
            <img src="/assets/images/brand/logo.png" alt="" width="40" height="40" />
            <span><strong>InkaQuest</strong><small>Rutas de aprendizaje en tecnología</small></span>
          </a>

          <p class="auth-kicker">Tu espacio de aprendizaje</p>
          <h1 id="login-title" class="auth-title">Qué bueno verte de nuevo.</h1>
          <p class="auth-subtitle">Ingresa para continuar tu ruta, resolver retos y seguir tu progreso real.</p>

          <form class="auth-form" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="auth-field">
              <label for="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autocomplete="email"
                formControlName="email"
                placeholder="tu@universidad.edu.pe"
                [attr.aria-invalid]="campoInvalido('email') ? true : null"
                [class.border-danger-500]="campoInvalido('email')"
              />
              <p class="field-error" aria-live="polite">{{ campoInvalido('email') ? errorControl('email') : '\u00A0' }}</p>
            </div>

            <div class="auth-field">
              <div class="flex items-center justify-between">
                <label for="password">Contraseña</label>
                <a routerLink="/recuperar-password" class="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div class="relative">
                <input
                  id="password"
                  [type]="verPassword() ? 'text' : 'password'"
                  class="pr-11"
                  autocomplete="current-password"
                  formControlName="password"
                  placeholder="Tu contraseña"
                  [attr.aria-invalid]="campoInvalido('password') ? true : null"
                  [class.border-danger-500]="campoInvalido('password')"
                />
                <button
                  type="button"
                  class="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-marine-400 hover:text-marine-700 hover:bg-surface-100 transition-colors"
                  [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="alternarVisibilidad()"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    @if (verPassword()) {
                      <path d="M3 3l18 18" stroke-linecap="round" />
                      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M6.7 6.7C4.6 8 3 10 2 12c1.7 3.9 5.7 7 10 7 1.6 0 3.1-.4 4.4-1.1M9.9 5.2A9.6 9.6 0 0 1 12 5c4.3 0 8.3 3.1 10 7a13 13 0 0 1-2.1 3.1" stroke-linecap="round" />
                    } @else {
                      <path d="M2 12c1.7-3.9 5.7-7 10-7s8.3 3.1 10 7c-1.7 3.9-5.7 7-10 7s-8.3-3.1-10-7z" stroke-linejoin="round" />
                      <circle cx="12" cy="12" r="3" />
                    }
                  </svg>
                </button>
              </div>
              <p class="field-error" aria-live="polite">{{ campoInvalido('password') ? errorControl('password') : '\u00A0' }}</p>
            </div>

            <button class="auth-submit mt-1" type="submit" [disabled]="cargando()">
              {{ cargando() ? 'Iniciando sesión…' : 'Iniciar sesión' }}
            </button>
          </form>

          @if (mensaje()) {
            <p class="auth-alert" [class.auth-success]="exito()" role="status">{{ mensaje() }}</p>
          }

          <div class="auth-footer">
            <p class="auth-note">Acceso seguro con tu cuenta registrada en InkaQuest.</p>
            <p class="auth-switch">¿Aún no tienes cuenta? <a routerLink="/registro">Crear una cuenta</a></p>
          </div>
        </div>
      </div>

      <aside class="auth-aside" aria-hidden="true">
        <div class="auth-aside__content">
          <p class="auth-aside__label">Aprende · Codifica · Avanza</p>
          <h2>Una ruta clara para seguir creciendo.</h2>
          <p>
            Estudia teoría, practica con retos y visualiza tu progreso con datos reales de tu aprendizaje.
          </p>
          <div class="auth-aside__art">
            <img src="/assets/images/brand/logo.png" alt="" width="420" height="420" loading="lazy" />
          </div>
        </div>
      </aside>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Formulario reactivo de acceso. */
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /** Estado de carga de la operacion. */
  protected readonly cargando = signal(false);
  /** Mensaje de resultado. */
  protected readonly mensaje = signal('');
  /** Indica si el mensaje es de exito. */
  protected readonly exito = signal(false);
  /** Indica si la contrasena se muestra en claro. */
  protected readonly verPassword = signal(false);

  constructor() {
    const params = this.router.parseUrl(this.router.url).queryParams;
    if (params['mensaje'] === 'cuenta-confirmada') {
      this.mensaje.set('Tu correo fue confirmado. Inicia sesión para continuar. Si ya iniciaste sesión y no puedes entrar al panel, tu perfil de estudiante podría no estar disponible aún.');
      this.exito.set(true);
    } else if (params['motivo'] === 'sesion-expirada') {
      this.mensaje.set('Tu sesión no se pudo verificar en el servidor. Inicia sesión de nuevo.');
      this.exito.set(false);
    }

    void this.redirigirSiAutenticado();
  }

  private async redirigirSiAutenticado(): Promise<void> {
    await this.esperarCargaAuth();
    if (this.auth.autenticado()) {
      await this.router.navigateByUrl(this.destinoSolicitado());
    }
  }

  private async esperarCargaAuth(): Promise<void> {
    const inicio = Date.now();
    while (this.auth.cargando() && Date.now() - inicio < 5000) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
  }

  /** Alterna la visibilidad de la contrasena. */
  protected alternarVisibilidad(): void {
    this.verPassword.update((v) => !v);
  }

  /** Indica si un control es invalido y fue tocado. */
  protected campoInvalido(nombre: string): boolean {
    const control = this.form.get(nombre);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Mensaje de error de un control. */
  protected errorControl(nombre: string): string {
    const control = this.form.get(nombre);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['email']) {
      return 'Introduce un correo electrónico válido.';
    }
    if (control.errors['minlength']) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    return 'Revisa este campo.';
  }

  /** Envia el formulario de acceso. */
  protected async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    try {
      const { email, password } = this.form.getRawValue();
      const resultado = await this.auth.iniciarSesion(email, password);

      if (!resultado.ok) {
        this.mensaje.set(resultado.mensaje);
        this.exito.set(false);
        return;
      }

      const destino = this.destinoSolicitado();
      await this.router.navigateByUrl(destino);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Determina la ruta de destino tras iniciar sesion.
   *
   * <p>Si venia de una pagina protegida se respeta el parametro
   * {@code retorno}; si no, se usa el panel que corresponde al rol.</p>
   */
  private destinoSolicitado(): string {
    const retorno = this.router.parseUrl(this.router.url).queryParams['retorno'];
    if (typeof retorno === 'string' && retorno.startsWith('/')) {
      return retorno;
    }
    switch (this.auth.rol()) {
      case 'administrador':
        return '/admin/dashboard';
      case 'docente':
        return '/docente/dashboard';
      default:
        return '/estudiante/dashboard';
    }
  }
}
