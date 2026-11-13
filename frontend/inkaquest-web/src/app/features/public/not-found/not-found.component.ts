// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Pagina 404 - ruta no encontrada.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <app-logo [alto]="64" variante="sobre-oscuro" />
        <p class="mt-6 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.22em] text-gold-300 uppercase ring-1 ring-white/15">Error 404</p>
        <h1 class="mt-4 text-white">Página no encontrada</h1>
        <p class="mt-3 max-w-md text-marine-100">
          La dirección que buscas no existe o fue movida. Puedes volver al inicio o explorar el catálogo de cursos.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a routerLink="/" class="btn btn-gold btn-lg">Ir al inicio</a>
          <a routerLink="/cursos" class="btn btn-outline-light btn-lg">Ver cursos</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
