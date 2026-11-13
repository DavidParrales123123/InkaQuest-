// @ts-nocheck
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Boton reutilizable del sistema de diseño.
 *
 * <p>Unifica los estilos de boton en un unico componente para que todas las
 * pantallas compartan la misma jerarquia visual y los mismos estados.</p>
 */
@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="tipo()"
      [class]="clases()"
      [disabled]="deshabilitado() || cargando()"
      [attr.aria-busy]="cargando() ? 'true' : null"
      (click)="alPulsar.emit()"
    >
      @if (cargando()) {
        <span
          class="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
        <span class="sr-only">{{ textoCargando() }}</span>
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class ButtonComponent {
  /** Variante visual. */
  readonly variante = input<'primario' | 'secundario' | 'contorno' | 'fantasma' | 'peligro' | 'oro'>(
    'primario',
  );
  /** Tamano del boton. */
  readonly tamano = input<'sm' | 'md' | 'lg'>('md');
  /** Texto accesible mientras carga. */
  readonly textoCargando = input('Cargando…');
  /** Estado de carga: muestra el spinner y deshabilita el boton. */
  readonly cargando = input(false);
  /** Deshabilita la accion. */
  readonly deshabilitado = input(false);
  /** Tipo del boton HTML. */
  readonly tipo = input<'button' | 'submit' | 'reset'>('button');

  /** Evento de pulsacion. */
  readonly alPulsar = output<void>();

  /** Clases CSS derivadas de los inputs. */
  protected clases(): string {
    const base = 'btn';
    const variantes: Record<string, string> = {
      primario: 'btn-primary',
      secundario: 'btn-secondary',
      contorno: 'btn-outline',
      fantasma: 'btn-ghost',
      peligro: 'btn-danger',
      oro: 'btn-gold',
    };
    const tamanos: Record<string, string> = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    };
    return [base, variantes[this.variante()], tamanos[this.tamano()]].join(' ');
  }
}
