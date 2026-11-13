// @ts-nocheck
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Contenedor de estados de datos.
 *
 * <p>Unifica los cuatro estados que exige la guia de experiencia de usuario
 * (carga, error, vacio y exito) para que ninguna pantalla los invente de
 * forma distinta. El contenido real se proyecta en el hueco {@code contenido}.</p>
 */
@Component({
  selector: 'app-data-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, SkeletonComponent],
  template: `
    @if (cargando()) {
      <div class="grid gap-4" [style.grid-template-columns]="columnas()">
        @for (i of [].constructor(placeholders()); track i) {
          <div class="card p-5">
            <app-skeleton alto="1rem" ancho="45%" />
            <div class="mt-3 space-y-2">
              <app-skeleton alto="0.85rem" />
              <app-skeleton alto="0.85rem" ancho="80%" />
            </div>
          </div>
        }
      </div>
    } @else if (error()) {
      <div class="card border-danger-100 bg-danger-50/60 p-6 text-center">
        <svg
          class="mx-auto size-8 text-danger-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path d="M12 9v4M12 17h.01" stroke-linecap="round" />
          <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke-linejoin="round" />
        </svg>
        <h3 class="mt-3 text-lg font-semibold text-marine-700">No se pudieron cargar los datos</h3>
        <p class="mx-auto mt-1.5 max-w-md text-sm text-marine-500">{{ error() }}</p>
        @if (reintentable()) {
          <button type="button" class="btn btn-outline btn-md mt-5" (click)="alReintentar.emit()">
            Reintentar
          </button>
        }
      </div>
    } @else if (vacio()) {
      <div class="card">
        <app-empty-state
          [titulo]="tituloVacio()"
          [descripcion]="descripcionVacia()"
          [accion]="accionVacia()"
          (alPulsarAccion)="alAccionVacia.emit()"
        >
          <ng-content select="[icono-vacio]" />
        </app-empty-state>
      </div>
    } @else {
      <ng-content select="[contenido]" />
    }
  `,
})
export class DataPanelComponent {
  /** Indica que los datos se estan cargando. */
  readonly cargando = input(false);
  /** Mensaje de error; si esta presente se muestra el estado de error. */
  readonly error = input<string | null>(null);
  /** Indica que no hay datos que mostrar. */
  readonly vacio = input(false);
  /** Titulo del estado vacio. */
  readonly tituloVacio = input('Todavía no hay nada aquí');
  /** Descripcion del estado vacio. */
  readonly descripcionVacia = input('');
  /** Texto de la accion del estado vacio (opcional). */
  readonly accionVacia = input<string | null>(null);
  /** Permite reintentar la carga cuando hay error. */
  readonly reintentable = input(true);
  /** Numero de esqueletos a mostrar durante la carga. */
  readonly placeholders = input(3);
  /** Columnas del grid de esqueletos. */
  readonly columnas = input('repeat(auto-fit, minmax(16rem, 1fr))');

  /** Evento de reintento. */
  readonly alReintentar = output<void>();
  /** Evento de la accion del estado vacio. */
  readonly alAccionVacia = output<void>();
}
