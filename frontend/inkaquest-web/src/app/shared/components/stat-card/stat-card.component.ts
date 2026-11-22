// @ts-nocheck
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Tarjeta de indicador (KPI).
 *
 * <p>Muestra un valor destacado, su etiqueta y un contexto opcional. Si se
 * indica {@code enlace}, la tarjeta se vuelve un acceso directo (teclado
 * incluido) a la sección correspondiente del panel.</p>
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover card-body relative h-full overflow-hidden"
      [class.cursor-pointer]="enlace()"
      [attr.role]="enlace() ? 'link' : null"
      [attr.tabindex]="enlace() ? 0 : null"
      (click)="abrir()" (keydown.enter)="abrir()" (keydown.space)="abrir($event)">
      <div class="absolute -right-6 -top-6 size-20 rounded-full bg-brand-500/5"></div>
      <div class="relative flex h-full items-start gap-4">
        @if (icono()) {
          <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5" [class]="tonoIcono()">
            <ng-content select="[icono]" />
          </span>
        }
        <div class="min-w-0">
          <p class="text-xs font-extrabold tracking-[0.12em] text-marine-500 uppercase truncate">{{ etiqueta() }}</p>
          <p class="mt-1 text-2xl font-extrabold tabular-nums text-marine-700 md:text-3xl">{{ valor() }}</p>
          @if (detalle()) {
            <p class="mt-1 text-xs font-medium text-marine-400 line-clamp-2">{{ detalle() }}</p>
          }
          @if (enlace()) {
            <span class="mt-1 inline-flex items-center gap-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-brand-600">
              Ver sección <span aria-hidden="true">→</span>
            </span>
          }
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  private readonly router = inject(Router);

  /** Texto de la etiqueta. */
  readonly etiqueta = input.required<string>();
  /** Valor principal. */
  readonly valor = input.required<string | number>();
  /** Contexto adicional bajo el valor. */
  readonly detalle = input<string | null>(null);
  /** Indica si se pinta el icono. */
  readonly icono = input(false);
  /** Tono visual del icono. */
  readonly tono = input<'brand' | 'success' | 'gold' | 'danger' | 'info' | 'surface'>('brand');
  /** Ruta a la que navega la tarjeta (opcional). */
  readonly enlace = input<string | null>(null);

  protected abrir(evento?: Event): void {
    const ruta = this.enlace();
    if (!ruta) return;
    evento?.preventDefault();
    void this.router.navigateByUrl(ruta);
  }

  /** Clases del contenedor del icono segun el tono. */
  protected tonoIcono(): string {
    switch (this.tono()) {
      case 'success':
        return 'bg-success-50 text-success-600';
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
