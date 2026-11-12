import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skeleton loader reutilizable.
 *
 * <p>Representa la forma del contenido mientras carga. Reduce la sensacion de
 * espera y evita saltos de layout al llegar los datos.</p>
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="skeleton()"
      [style.width]="ancho()"
      [style.height]="alto()"
      [style.border-radius]="radio()"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  /** Ancho del bloque. */
  readonly ancho = input('100%');
  /** Alto del bloque. */
  readonly alto = input('1rem');
  /** Radio de las esquinas. */
  readonly radio = input('0.5rem');
  /** Clases adicionales. */
  readonly clase = input('');
  /** Classes CSS calculadas. */
  protected skeleton(): string {
    return ['skeleton', this.clase()].filter(Boolean).join(' ');
  }
}
