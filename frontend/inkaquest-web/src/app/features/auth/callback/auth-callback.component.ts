// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/**
 * Retorno de la confirmación de correo (y enlaces de auth en URL).
 *
 * <p>Supabase Auth procesa el token en la URL ({@code detectSessionInUrl}) y
 * emite cambios de sesión. Esta pantalla espera a que la sesión/perfil estén
 * disponibles y redirige automáticamente al panel correspondiente.</p>
 */
@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="card mx-auto max-w-md p-8 text-center shadow-2xl">
      @if (procesando()) {
        <div
          class="mx-auto size-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-brand-500"
          aria-hidden="true"
        ></div>
        <h1 class="mt-5 text-xl">Confirmando tu acceso</h1>
        <p class="mt-2 text-sm text-marine-500">
          Estamos validando el enlace que recibiste por correo electrónico.
        </p>
      } @else if (exito()) {
        <span
          class="mx-auto flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600"
        >
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <h1 class="mt-5 text-xl">Correo confirmado</h1>
        <p class="mt-2 text-sm text-marine-500">
          Tu cuenta ya está activa. Redirigiéndote a tu panel…
        </p>
        <button type="button" class="btn btn-primary btn-md mt-6 w-full" (click)="irAlPanel()">
          Continuar
        </button>
      } @else {
        <span
          class="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-600"
        >
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 8v5M12 16h.01" stroke-linecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <h1 class="mt-5 text-xl">No pudimos confirmar tu correo</h1>
        <p class="mt-2 text-sm text-marine-500">{{ mensaje() }}</p>
        <button type="button" class="btn btn-primary btn-md mt-6 w-full" (click)="reintentar()">
          Ir a iniciar sesión
        </button>
        <a routerLink="/" class="btn btn-outline btn-md mt-2 w-full">Volver al inicio</a>
      }
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Indica que se está validando el enlace. */
  protected readonly procesando = signal(true);
  /** Indica que la confirmación fue correcta. */
  protected readonly exito = signal(false);
  /** Mensaje de error. */
  protected readonly mensaje = signal('');

  ngOnInit(): void {
    void this.verificar();
  }

  /** Espera la sesión de Supabase y redirige al panel. */
  private async verificar(): Promise<void> {
    const usuario = await this.esperarUsuario(8000);
    if (!usuario) {
      this.exito.set(false);
      this.procesando.set(false);
      this.mensaje.set(
        'El enlace pudo haber expirado o haber sido usado antes. Inicia sesión o solicita un nuevo enlace.',
      );
      return;
    }

    // La fila de perfil puede tardar unos instantes (trigger tras registro).
    await this.esperarPerfil(4000);

    this.exito.set(true);
    this.procesando.set(false);

    // Redirección automática para que el usuario no quede detenido en esta pantalla.
    setTimeout(() => this.irAlPanel(), 900);
  }

  /** Espera a que AuthService detecte el usuario autenticado. */
  private async esperarUsuario(timeoutMs: number): Promise<boolean> {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      if (!this.auth.cargando() && this.auth.usuario()) {
        return true;
      }
      // Forzar actualización por si el evento de auth llegó antes de suscribirse.
      await this.auth.cargarPerfil();
      if (this.auth.usuario()) {
        return true;
      }
      await this.espera(250);
    }
    return !!this.auth.usuario();
  }

  /** Intenta cargar el perfil de aplicación (rol) con reintentos breves. */
  private async esperarPerfil(timeoutMs: number): Promise<void> {
    const inicio = Date.now();
    let intentoCreacion = false;
    while (Date.now() - inicio < timeoutMs) {
      let perfil = await this.auth.cargarPerfil();
      if (perfil?.rol) {
        return;
      }

      // Si hay sesión pero no perfil/rol, intenta asegurar el perfil básico una vez.
      if (!intentoCreacion && this.auth.usuario()) {
        intentoCreacion = true;
        await this.auth.asegurarPerfilBasico();
        perfil = await this.auth.cargarPerfil();
        if (perfil?.rol) {
          return;
        }
      }

      await this.espera(300);
    }

    // Último intento antes de redirigir.
    if (this.auth.usuario() && !this.auth.rol()) {
      await this.auth.asegurarPerfilBasico();
      await this.auth.cargarPerfil();
    }
  }

  private espera(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Dirige al panel del usuario (o a inicio de sesión si no hay sesión). */
  protected irAlPanel(): void {
    if (!this.auth.usuario()) {
      void this.router.navigate(['/login']);
      return;
    }
    switch (this.auth.rol()) {
      case 'administrador':
        void this.router.navigate(['/admin/dashboard']);
        break;
      case 'docente':
        void this.router.navigate(['/docente/dashboard']);
        break;
      case 'estudiante':
        void this.router.navigate(['/estudiante/dashboard']);
        break;
      default:
        // Sesión válida pero perfil/rol aún no disponible: intentar ir al panel de estudiante.
        // El guard intentará resolver/cargar el perfil y, si no es posible, aplicará fallback.
        void this.router.navigate(['/estudiante/dashboard']);
        break;
    }
  }

  /** Vuelve a la pantalla de inicio de sesión. */
  protected reintentar(): void {
    void this.router.navigate(['/login']);
  }
}
