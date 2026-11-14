// @ts-nocheck
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

/** Elemento de navegacion de un panel. */
export interface ElementoPanel {
  /** Texto visible. */
  readonly texto: string;
  /** Ruta destino. */
  readonly ruta: string;
  /** Icono Lucide (nombre del icono del paquete @lucide/angular). */
  readonly icono: string;
  /** Coincidencia exacta de la ruta activa. */
  readonly exacto?: boolean;
}

/** Seccion de navegacion con titulo. */
export interface SeccionPanel {
  readonly titulo: string;
  readonly elementos: readonly ElementoPanel[];
}

/**
 * Estructura comun de los paneles (estudiante, docente y administrador).
 *
 * <p>Centraliza la barra lateral adaptable, la cabecera con los datos del
 * usuario y el area de contenido. Cada panel aporta su propia navegacion
 * mediante el input {@code secciones}.</p>
 */
@Component({
  selector: 'app-panel-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="min-h-screen bg-[#f6f8f5] lg:flex">
      @if (menuAbierto()) {
        <button
          type="button"
          class="fixed inset-0 z-40 bg-marine-900/60 backdrop-blur-[1px] lg:hidden"
          aria-label="Cerrar el menú de navegación"
          (click)="cerrarMenu()"
        ></button>
      }

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-marine-gradient text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
        [class.-translate-x-full]="!menuAbierto()"
        [class.translate-x-0]="menuAbierto()"
      >
        <div class="relative flex h-[4.5rem] shrink-0 items-center justify-center border-b border-white/10 px-5">
          <a [routerLink]="rutaInicio()" class="flex items-center gap-2.5" aria-label="InkaQuest">
            <app-logo [alto]="36" variante="sobre-oscuro" />
            <span class="text-base font-extrabold tracking-tight text-white">Inka<span class="text-gold-400">Quest</span></span>
          </a>
          <button
            type="button"
            class="absolute right-3 rounded-xl p-2 text-marine-200 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar el menú"
            (click)="cerrarMenu()"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="border-b border-white/10 px-4 py-4">
          <div class="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            @if (auth.perfil()?.avatar_url) {
              <img [src]="auth.perfil()!.avatar_url!" [alt]="''" class="size-10 rounded-full object-cover ring-2 ring-gold-400/40" />
            } @else {
              <span class="flex size-10 items-center justify-center rounded-full bg-gold-500 text-sm font-extrabold text-marine-900">{{ iniciales() }}</span>
            }
            <div class="min-w-0">
              <p class="truncate text-sm font-extrabold text-white">{{ nombreUsuario() }}</p>
              <p class="truncate text-xs text-marine-200">{{ etiquetaRol() }}</p>
            </div>
          </div>
        </div>

        <nav class="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación del panel">
          @for (seccion of secciones(); track seccion.titulo) {
            <div class="mb-5">
              <p class="px-3 pb-2 text-[0.68rem] font-extrabold tracking-[0.16em] text-marine-300 uppercase">
                {{ seccion.titulo }}
              </p>
              <ul class="space-y-1">
                @for (elemento of seccion.elementos; track elemento.ruta) {
                  <li>
                    <a
                      [routerLink]="elemento.ruta"
                      routerLinkActive="!bg-white/12 !text-white ring-1 ring-white/10 shadow-[inset_3px_0_0_#f2a541]"
                      [routerLinkActiveOptions]="{ exact: elemento.exacto ?? false }"
                      class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-marine-100 transition-all hover:bg-white/8 hover:text-white"
                      (click)="cerrarMenu()"
                    >
                      <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold-300">
                        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          @switch (elemento.icono) {
                            @case ('dashboard') { <path d="M3 3h7v8H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 15h7v6H3z" stroke-linejoin="round" /> }
                            @case ('book') { <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" stroke-linejoin="round" /> }
                            @case ('layers') { <path d="M12 3 2 8l10 5 10-5z" stroke-linejoin="round" /><path d="M2 13l10 5 10-5M2 18l10 5 10-5" stroke-linecap="round" stroke-linejoin="round" /> }
                            @case ('graduation') { <path d="m12 4 10 5-10 5L2 9z" stroke-linejoin="round" /><path d="M6 11v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" /> }
                            @case ('activity') { <path d="M3 12h4l3 8 4-16 3 8h4" stroke-linecap="round" stroke-linejoin="round" /> }
                            @case ('clipboard') { <path d="M9 4h6v3H9z" stroke-linejoin="round" /><path d="M9 5.5H7a2 2 0 0 0-2 2V20h14V7.5a2 2 0 0 0-2-2h-2" stroke-linejoin="round" /> }
                            @case ('gamepad') { <path d="M7 8h10a4 4 0 0 1 3.9 4.9l-.6 3A2.5 2.5 0 0 1 15.7 17L14 15h-4l-1.7 2a2.5 2.5 0 0 1-4.6-1.1l-.6-3A4 4 0 0 1 7 8z" stroke-linejoin="round" /><path d="M7 11v4M5 13h4M15.5 12.5h.01M18 14h.01" stroke-linecap="round" /> }
                            @case ('code') { <path d="m9 8-5 4 5 4M15 8l5 4-5 4" stroke-linecap="round" stroke-linejoin="round" /> }
                            @case ('trophy') { <path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke-linejoin="round" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 14v6" stroke-linecap="round" /> }
                            @case ('medal') { <circle cx="12" cy="15" r="5" /><path d="m8.5 10.5-3-7h5l1.5 4 1.5-4h5l-3 7" stroke-linejoin="round" /> }
                            @case ('award') { <circle cx="12" cy="9" r="5" /><path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" stroke-linejoin="round" /> }
                            @case ('chart') { <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round" /> }
                            @case ('wallet') { <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round" /><path d="M16 12h3" stroke-linecap="round" /> }
                            @case ('certificate') { <path d="M6 3h12v13H6z" stroke-linejoin="round" /><path d="M9 7h6M9 11h4M12 16v5l-2-1.5L8 21v-5" stroke-linejoin="round" /> }
                            @case ('bell') { <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" stroke-linejoin="round" /><path d="M10.3 20a2 2 0 0 0 3.4 0" stroke-linecap="round" /> }
                            @case ('help') { <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.9-.9 1.6v.6" stroke-linecap="round" /><path d="M12 17h.01" stroke-linecap="round" /> }
                            @case ('users') { <circle cx="9" cy="8" r="3.2" /><path d="M3 19a6 6 0 0 1 12 0" stroke-linecap="round" /><path d="M16 5.5a3 3 0 0 1 0 5.5M17 13.5a6 6 0 0 1 4 5.5" stroke-linecap="round" /> }
                            @case ('shield') { <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6z" stroke-linejoin="round" /> }
                            @case ('cog') { <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke-linecap="round" /> }
                            @case ('file') { <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke-linejoin="round" /><path d="M14 3v5h5" stroke-linejoin="round" /> }
                            @case ('inbox') { <path d="M4 13h4l1.5 3h5L16 13h4" stroke-linejoin="round" /><path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" stroke-linejoin="round" /> }
                            @case ('logout') { <path d="M15 17l5-5-5-5M20 12H9" stroke-linecap="round" stroke-linejoin="round" /><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" stroke-linecap="round" /> }
                            @default { <circle cx="12" cy="12" r="8" /> }
                          }
                        </svg>
                      </span>
                      <span class="truncate">{{ elemento.texto }}</span>
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>

        <div class="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-marine-100 transition-colors hover:bg-danger-500/15 hover:text-white"
            (click)="cerrarSesion()"
          >
            <span class="flex size-8 items-center justify-center rounded-lg bg-white/5 text-gold-300">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M15 17l5-5-5-5M20 12H9" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" stroke-linecap="round" />
              </svg>
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-surface-200/80 bg-white/85 backdrop-blur-md">
          <div class="flex h-[4.25rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl p-2 text-marine-700 hover:bg-surface-100 lg:hidden"
              aria-label="Abrir el menú de navegación"
              (click)="abrirMenu()"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
              </svg>
            </button>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-extrabold text-marine-700">{{ nombreUsuario() }}</p>
            </div>

            <a
              [routerLink]="rutaNotificaciones()"
              class="relative inline-flex size-10 items-center justify-center rounded-xl text-marine-600 transition-colors hover:bg-surface-100 hover:text-marine-800"
              [attr.aria-label]="noLeidas() > 0 ? 'Notificaciones, ' + noLeidas() + ' sin leer' : 'Notificaciones'"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" stroke-linejoin="round" />
                <path d="M10.3 20a2 2 0 0 0 3.4 0" stroke-linecap="round" />
              </svg>
              @if (noLeidas() > 0) {
                <span class="absolute -top-0.5 -right-0.5 flex min-w-[1.15rem] h-[1.15rem] items-center justify-center rounded-full bg-danger-600 px-1 text-[0.65rem] font-extrabold text-white ring-2 ring-white">
                  {{ noLeidas() > 9 ? '9+' : noLeidas() }}
                </span>
              }
            </a>

            @if (auth.perfil()?.avatar_url) {
              <img [src]="auth.perfil()!.avatar_url!" [alt]="'Foto de perfil de ' + nombreUsuario()" class="size-9 rounded-full object-cover ring-2 ring-surface-200" />
            } @else {
              <span class="flex size-9 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white" aria-hidden="true">{{ iniciales() }}</span>
            }
          </div>
        </header>

        <main class="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          <div class="mx-auto w-full max-w-7xl">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class PanelLayoutComponent implements OnInit {
  /** Secciones del menu lateral. */
  readonly secciones = input.required<readonly SeccionPanel[]>();
  /** Ruta de inicio del panel (logo). */
  readonly rutaInicio = input.required<string>();
  /** Ruta del centro de notificaciones. */
  readonly rutaNotificaciones = input('/estudiante/notificaciones');

  /** Servicio de autenticacion. */
  protected readonly auth = inject(AuthService);
  /** Servicio de notificaciones. */
  private readonly notifications = inject(NotificationService);
  /** Router. */
  private readonly router = inject(Router);
  /** Limpieza de suscripciones. */
  private readonly destroyRef = inject(DestroyRef);

  /** Estado del menu movil. */
  protected readonly menuAbierto = signal(false);
  /** Numero de notificaciones no leidas. */
  protected readonly noLeidas = signal(0);

  /** Nombre visible del usuario. */
  protected readonly nombreUsuario = computed(() => {
    const perfil = this.auth.perfil();
    if (!perfil) {
      return 'Usuario';
    }
    return [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || perfil.email;
  });

  /** Iniciales para el avatar de texto. */
  protected readonly iniciales = computed(() => {
    const partes = this.nombreUsuario().split(' ').filter(Boolean);
    return partes
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  /** Etiqueta del rol segun el panel. */
  protected readonly etiquetaRol = computed(() => {
    switch (this.auth.rol()) {
      case 'administrador':
        return 'Administrador';
      case 'docente':
        return 'Docente';
      case 'estudiante':
        return 'Estudiante';
      default:
        return 'Invitado';
    }
  });

  /** Abre el menu lateral en movil. */
  protected abrirMenu(): void {
    this.menuAbierto.set(true);
  }

  /** Cierra el menu lateral. */
  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  /** Refresca el contador al recuperar el foco de la ventana (p. ej. tras alt-tab). */
  private readonly manejarFocoVentana = (): void => {
    void this.cargarNoLeidas();
  };

  /** Carga el numero de notificaciones sin leer. */
  ngOnInit(): void {
    void this.cargarNoLeidas();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.cargarNoLeidas();
      });

    // Sondea cada 60 s mientras la pestaña está visible (el estado de lectura
    // también cambia por acciones ajenas a la navegación, p. ej. desde otro
    // dispositivo). Se limpia al destruir el layout.
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const intervalo = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void this.cargarNoLeidas();
        }
      }, 60_000);
      window.addEventListener('focus', this.manejarFocoVentana);
      this.destroyRef.onDestroy(() => {
        window.clearInterval(intervalo);
        window.removeEventListener('focus', this.manejarFocoVentana);
      });
    }
  }

  /** Consulta el contador de notificaciones pendientes. */
  private async cargarNoLeidas(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    try {
      this.noLeidas.set(await this.notifications.contarNoLeidas(usuario.id));
    } catch {
      this.noLeidas.set(0);
    }
  }

  /** Cierra la sesion y vuelve al inicio publico. */
  protected cerrarSesion(): void {
    void this.auth.cerrarSesion();
    void this.router.navigate(['/']);
  }
}
