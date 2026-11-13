// @ts-nocheck
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tarjeta de indicador (KPI).
 *
 * <p>Muestra un valor destacado, su etiqueta y un contexto opcional. Es el
 * componente base de los tableros de estudiante, docente y administrador.</p>
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover card-body relative h-full overflow-hidden">
      <div class="absolute -right-6 -top-6 size-20 rounded-full bg-brand-500/5"></div>
      <div class="relative flex h-full items-start gap-4">
        @if (icono()) {
          <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5" [class]="tonoIcono()">
            <ng-content select="[icono]" />
          </span>
        }
        <div class="min-w-0">
          <p class="text-xs font-extrabold tracking-[0.12em] text-marine-500 uppercase">{{ etiqueta() }}</p>
          <p class="mt-1 text-2xl font-extrabold text-marine-700 md:text-3xl">{{ valor() }}</p>
          @if (detalle()) {
            <p class="mt-1 text-xs font-medium text-marine-400">{{ detalle() }}</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  /** Texto de la etiqueta. */
  readonly etiqueta = input.required<string>();
  /** Valor principal. */
  readonly valor = input.required<string | number>();
  /** Contexto adicional bajo el valor. */
  readonly detalle = input<string | null>(null);
  /** Indica si se pinta el icono. */
  readonly icono = input(false);
  /** Tono visual del icono. */
  readonly tono = input<'brand' | 'gold' | 'danger' | 'info' | 'surface'>('brand');

  /** Clases del contenedor del icono segun el tono. */
  protected tonoIcono(): string {
    switch (this.tono()) {
      case 'gold':
        return 'bg-gold-50 text-gold-700';
      case 'danger':
        return 'bg-danger-50 text-danger-600';
      case 'info':
        return 'bg-info-50 text-info-500';
      case 'surface':
        return 'bg-surface-100 text-marine-600';
      default:
        return 'bg-brand-50 text-brand-600';
    }
  }
}
