// @ts-nocheck
﻿import { Injectable, signal } from '@angular/core';

/**
 * Bus global de errores para que cualquier capa pueda avisar.
 *
 * <p>Un Ãºnico punto visual (`GlobalErrorBannerComponent`) escucha este bus y
 * muestra el aviso; nadie necesita inyectar componentes para reportar un
 * error global.</p>
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorBusService {
  private readonly _mensaje = signal<string | null>(null);

  /** Mensaje actual, o null si no hay aviso. */
  readonly mensaje = this._mensaje.asReadonly();

  /** Muestra un aviso global (se autooculta tras 6 s). */
  reportar(mensaje: string): void {
    this._mensaje.set(mensaje);
    globalThis.setTimeout(() => {
      if (this._mensaje() === mensaje) {
        this._mensaje.set(null);
      }
    }, 6000);
  }

  /** Oculta el aviso actual. */
  descartar(): void {
    this._mensaje.set(null);
  }
}
