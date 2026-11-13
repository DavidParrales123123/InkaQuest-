// @ts-nocheck
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Encabezado de pagina de panel.
 *
 * <p>Unifica el titulo, la descripcion y las acciones principales de cada
 * pantalla interna, para que la jerarquia visual sea consistente.</p>
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-surface-200 bg-white/70 p-5 shadow-[0_4px_16px_rgba(27,42,74,0.04)] backdrop-blur-sm md:mb-10 md:p-6">
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[0.68rem] font-extrabold tracking-[0.18em] text-brand-700 uppercase">
            {{ eyebrow() }}
          </p>
        }
        <h1 class="mt-2 text-2xl text-marine-700 md:text-3xl">{{ titulo() }}</h1>
        @if (descripcion()) {
          <p class="mt-1.5 max-w-2xl text-sm leading-relaxed text-marine-500">{{ descripcion() }}</p>
        }
      </div>
      @if (acciones()) {
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <ng-content select="[acciones]" />
        </div>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  /** Antetitulo contextual (por ejemplo, el nombre del curso). */
  readonly eyebrow = input<string | null>(null);
  /** Titulo de la pagina. */
  readonly titulo = input.required<string>();
  /** Descripcion opcional bajo el titulo. */
  readonly descripcion = input<string | null>(null);
  /** Indica si hay acciones a la derecha. */
  readonly acciones = input(false);
}
