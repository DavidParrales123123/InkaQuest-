// @ts-nocheck
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Estado vacio reutilizable.
 *
 * <p>Comunica de forma clara que no hay datos y ofrece una accion cuando la
 * hay. Es un requisito de UX: una pantalla sin datos debe explicar por que.</p>
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state-block">
      @if (icono()) {
        <div class="flex size-14 items-center justify-center rounded-full bg-surface-100 text-brand-500">
          <ng-content select="[icono]" />
        </div>
      }
      <h3 class="text-lg font-semibold text-marine-700">{{ titulo() }}</h3>
      @if (descripcion()) {
        <p class="max-w-md text-sm text-marine-500">{{ descripcion() }}</p>
      }
      @if (accion()) {
        <button type="button" class="btn btn-primary btn-md mt-2" (click)="alPulsarAccion.emit()">
          {{ accion() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  /** Titulo del estado. */
  readonly titulo = input('Todavía no hay nada aquí');
  /** Descripcion opcional. */
  readonly descripcion = input('');
  /** Texto del boton de accion (opcional). */
  readonly accion = input<string | null>(null);
  /** Indica si se muestra el icono. */
  readonly icono = input(true);

  /** Evento de la accion. */
  readonly alPulsarAccion = output<void>();
}
