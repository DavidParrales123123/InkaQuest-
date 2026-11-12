import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { GlobalErrorBusService } from '../../../core/errors/global-error-bus.service';

/**
 * Banda global de error: se muestra en la raÃ­z de la app cuando cualquier
 * capa reporta un fallo no controlado. El usuario puede descartarla.
 */
@Component({
  selector: 'app-global-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  template: `
    @if (bus.mensaje(); as mensaje) {
      <div class="global-error" role="alert" aria-live="assertive">
        <div class="global-error__inner">
          <span class="global-error__icon" aria-hidden="true">!</span>
          <p class="global-error__text">{{ mensaje }}</p>
          <button type="button" class="global-error__close" (click)="bus.descartar()" aria-label="Descartar">
            Ã—
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .global-error {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #fee2e2;
        color: #991b1b;
        border-bottom: 1px solid #fecaca;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .global-error__inner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 72rem;
        margin: 0 auto;
        padding: 0.6rem 1rem;
        font-size: 0.875rem;
      }
      .global-error__icon {
        flex: 0 0 auto;
        width: 1.5rem;
        height: 1.5rem;
        display: grid;
        place-items: center;
        border-radius: 9999px;
        background: #fecaca;
        font-weight: 800;
      }
      .global-error__text {
        flex: 1;
        margin: 0;
      }
      .global-error__close {
        flex: 0 0 auto;
        border: none;
        background: transparent;
        color: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        padding: 0.25rem;
      }
    `,
  ],
})
export class GlobalErrorBannerComponent {
  protected readonly bus = inject(GlobalErrorBusService);
}
