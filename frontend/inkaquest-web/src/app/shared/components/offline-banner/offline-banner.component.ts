import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

/** Aviso flotante cuando el dispositivo pierde la conexión (típico en móvil). */
@Component({
  selector: 'app-offline-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!enLinea()) {
      <div class="fixed inset-x-0 top-0 z-[90] bg-danger-600 px-4 py-2 text-center text-xs font-bold text-white shadow-lg" role="status">
        Sin conexión. Revisa tu internet antes de guardar cambios.
      </div>
    }
  `,
})
export class OfflineBannerComponent {
  protected readonly enLinea = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (typeof window === 'undefined') return;
    const actualizar = (): void => this.enLinea.set(navigator.onLine);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', actualizar);
      window.removeEventListener('offline', actualizar);
    });
  }
}
