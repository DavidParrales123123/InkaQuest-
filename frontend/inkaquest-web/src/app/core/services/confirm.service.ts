// @ts-nocheck
import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  /** Título corto de la acción (ej. "Eliminar tarea"). */
  title: string;
  /** Mensaje de confirmación (cuerpo). */
  mensaje: string;
  /** Texto del botón de confirmación (por defecto "Eliminar"). */
  textoConfirmar?: string;
  /** Variante visual: `peligro` (default) usa botón rojo; cualquier otra variante usa primario. */
  variante?: 'peligro' | 'primario';
}

/**
 * Servicio de confirmación in-app.
 *
 * Reemplaza el `window.confirm` del navegador por un diálogo propio,
 * consistente con el resto del diseño. Uso:
 *
 *   const ok = await this.confirm.ask({
 *     title: 'Eliminar tarea',
 *     mensaje: `¿Eliminar la tarea "${t.actividad.titulo}"?`,
 *   });
 *   if (!ok) return;
 *
 * Responde `true` si el usuario confirma; `false` en cancelar/backdrop/Escape.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<(ConfirmOptions & { id: number }) | null>(null);
  private resolver: ((v: boolean) => void) | null = null;
  private seq = 0;

  ask(opts: ConfirmOptions): Promise<boolean> {
    if (this.resolver) this.resolver(false);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this.state.set({ ...opts, id: ++this.seq });
    });
  }

  responder(valor: boolean): void {
    const r = this.resolver;
    this.resolver = null;
    this.state.set(null);
    r?.(valor);
  }
}
