// @ts-nocheck
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logotipo oficial de InkaQuest.
 *
 * <p>Usa el recurso original optimizado en
 * {@code src/assets/images/brand/logo.webp} (y su version PNG de respaldo).
 * El archivo original no se modifica.</p>
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      [src]="rutaLogo()"
      [alt]="textoAlternativo()"
      [width]="ancho()"
      [height]="alto()"
      [class]="clases()"
      loading="eager"
      decoding="async"
    />
  `,
})
export class LogoComponent {
  /** Altura en pixeles. */
  readonly alto = input(40);
  /** Texto alternativo (accesibilidad). */
  readonly textoAlternativo = input('InkaQuest');
  /** Si se muestra sobre fondo oscuro, se aplica un filtro de brillo. */
  readonly variante = input<'normal' | 'sobre-oscuro'>('normal');

  /** Ruta del recurso de marca. */
  protected rutaLogo(): string {
    return '/assets/images/brand/logo.png';
  }

  /** Ancho proporcional al alto. */
  protected ancho(): number {
    return this.alto();
  }

  /** Clases/estilos segun la variante. */
  protected clases(): string {
    return this.variante() === 'sobre-oscuro'
      ? 'rounded-lg bg-white/95 p-0.5 object-contain'
      : 'object-contain';
  }
}
