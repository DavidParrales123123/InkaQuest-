import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Barra de navegación pública.
 */
@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  styles: [`
    .site-header {
      position: sticky; top: 0; z-index: 50;
      background: rgba(255, 255, 255, 0.97);
      border-bottom: 1px solid #e2ece9;
      backdrop-filter: saturate(140%) blur(10px);
    }
    .site-header__inner {
      max-width: 80rem; margin: 0 auto; padding: 0 1.25rem;
      height: 4.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
    }
    .header__brand {
      display: inline-flex; align-items: center; gap: 0.65rem; text-decoration: none;
      color: #1b2a4a; font-family: var(--), var(--font-sans);
      font-weight: 800; font-size: 1.3rem; letter-spacing: -0.02em; flex-shrink: 0;
    }
    .header__nav {
      display: none; align-items: center; justify-content: center; gap: 0.25rem;
      flex: 1; min-width: 0;
    }
    .header__nav-link {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.55rem 0.95rem; border-radius: 999px; text-decoration: none;
      font-size: 0.92rem; font-weight: 600; color: #4b5f74;
      transition: color 160ms ease, background 160ms ease;
      white-space: nowrap;
    }
    .header__nav-link:hover { color: #12736b; background: #eef6f4; }
    .header__nav-link.active { color: #1b2a4a; background: #e7f1ef; font-weight: 700; }
    .header__actions {
      display: none; align-items: center; justify-content: flex-end; gap: 0.6rem; flex-shrink: 0;
    }
    .header__btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.55rem 1.05rem; border-radius: 0.75rem;
      font-size: 0.875rem; font-weight: 700; cursor: pointer;
      border: 1px solid transparent; text-decoration: none;
      transition: all 160ms ease; background: transparent; white-space: nowrap; line-height: 1.2;
    }
    .header__btn--primary {
      background: #12736b; color: #fff; border-color: #12736b;
      box-shadow: 0 6px 14px rgb(18 115 107 / 0.18);
    }
    .header__btn--primary:hover { background: #0f5d57; border-color: #0f5d57; transform: translateY(-1px); }
    .header__btn--ghost { color: #2f4563; border-color: #d4e3e0; background: #fff; }
    .header__btn--ghost:hover { background: #f4f8f7; border-color: #bfd4d0; color: #1b2a4a; }
    .header__btn--plain { color: #5a6d82; padding-inline: 0.65rem; }
    .header__btn--plain:hover { color: #1b2a4a; background: #f4f8f7; }
    .header__toggle {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2.5rem; height: 2.5rem; padding: 0; border: 1px solid #dce7e4;
      border-radius: 0.75rem; background: #fff; color: #1b2a4a; cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease; flex-shrink: 0;
    }
    .header__toggle:hover { background: #f4f8f7; border-color: #c9dbd8; }
    .header__toggle svg { width: 1.25rem; height: 1.25rem; }
    .header__mobile {
      border-top: 1px solid #e4efed; background: #fff;
      padding: 0.75rem 1.25rem 1.25rem;
    }
    .header__mobile-inner { max-width: 80rem; margin: 0 auto; }
    .header__mobile-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.2rem; }
    .header__mobile-link {
      display: flex; align-items: center; padding: 0.8rem 1rem; border-radius: 0.85rem;
      text-decoration: none; font-size: 0.98rem; font-weight: 600; color: #334a63;
      transition: background 160ms ease, color 160ms ease;
    }
    .header__mobile-link:hover { background: #f4f8f7; color: #12736b; }
    .header__mobile-link.active { background: #e7f1ef; color: #1b2a4a; font-weight: 700; }
    .header__mobile-actions {
      margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid #e4efed;
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
    }
    .header__mobile-actions .header__btn { width: 100%; padding: 0.7rem 1rem; }
    .header__mobile-actions .header__btn--single { grid-column: 1 / -1; }
    @media (min-width: 1024px) {
      .header__nav { display: flex; }
      .header__actions { display: flex; }
      .header__toggle { display: none; }
    }
  `],
  template: `
    <header class="site-header">
      <div class="site-header__inner">
        <a routerLink="/" class="header__brand" aria-label="InkaQuest, ir al inicio">
          <app-logo [alto]="34" />
          <span>InkaQuest</span>
        </a>

        <nav class="header__nav" aria-label="Principal">
          @for (enlace of enlaces; track enlace.ruta) {
            <a
              [routerLink]="enlace.ruta"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: enlace.exacto }"
              class="header__nav-link"
            >{{ enlace.texto }}</a>
          }
        </nav>

        <div class="header__actions">
          @if (auth.autenticado()) {
            <a [routerLink]="rutaPanel()" class="header__btn header__btn--ghost">{{ nombrePanel() }}</a>
            <button type="button" class="header__btn header__btn--plain" (click)="cerrarSesion()">Cerrar sesión</button>
          } @else {
            <a routerLink="/login" class="header__btn header__btn--ghost">Iniciar sesión</a>
            <a routerLink="/registro" class="header__btn header__btn--primary">Crear cuenta</a>
          }
        </div>

        <button
          type="button"
          class="header__toggle"
          [attr.aria-expanded]="menuAbierto()"
          aria-controls="menu-movil"
          [attr.aria-label]="menuAbierto() ? 'Cerrar menú' : 'Abrir menú'"
          (click)="alternarMenu()"
        >
          @if (menuAbierto()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
            </svg>
          }
        </button>
      </div>

      @if (menuAbierto()) {
        <div id="menu-movil" class="header__mobile">
          <div class="header__mobile-inner">
            <ul class="header__mobile-list">
              @for (enlace of enlaces; track enlace.ruta) {
                <li>
                  <a
                    [routerLink]="enlace.ruta"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: enlace.exacto }"
                    class="header__mobile-link"
                    (click)="cerrarMenu()"
                  >{{ enlace.texto }}</a>
                </li>
              }
            </ul>
            <div class="header__mobile-actions">
              @if (auth.autenticado()) {
                <a [routerLink]="rutaPanel()" class="header__btn header__btn--ghost header__btn--single" (click)="cerrarMenu()">{{ nombrePanel() }}</a>
                <button type="button" class="header__btn header__btn--plain header__btn--single" (click)="cerrarSesion()">Cerrar sesión</button>
              } @else {
                <a routerLink="/login" class="header__btn header__btn--ghost" (click)="cerrarMenu()">Iniciar sesión</a>
                <a routerLink="/registro" class="header__btn header__btn--primary" (click)="cerrarMenu()">Crear cuenta</a>
              }
            </div>
          </div>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly menuAbierto = signal(false);

  protected readonly enlaces = [
    { texto: 'Inicio', ruta: '/', exacto: true },
    { texto: 'Cursos', ruta: '/cursos', exacto: false },
    { texto: 'Planes', ruta: '/planes', exacto: false },
    { texto: 'Contacto', ruta: '/contacto', exacto: false },
  ];

  protected readonly rutaPanel = computed(() => {
    switch (this.auth.rol()) {
      case 'administrador': return '/admin/dashboard';
      case 'docente': return '/docente/dashboard';
      case 'estudiante': return '/estudiante/dashboard';
      default: return '/estudiante/dashboard';
    }
  });

  protected readonly nombrePanel = computed(() => {
    switch (this.auth.rol()) {
      case 'administrador': return 'Panel admin';
      case 'docente': return 'Panel docente';
      case 'estudiante': return 'Mi panel';
      default: return 'Mi cuenta';
    }
  });

  protected alternarMenu(): void { this.menuAbierto.update((v) => !v); }
  protected cerrarMenu(): void { this.menuAbierto.set(false); }
  protected cerrarSesion(): void { void this.auth.cerrarSesion(); this.cerrarMenu(); }
}
