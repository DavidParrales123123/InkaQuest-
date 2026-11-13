// @ts-nocheck
import { ErrorHandler, Injectable, inject } from '@angular/core';

import { GlobalErrorBusService } from './global-error-bus.service';
import { mensajeGlobalDeError, sanitizarErrorParaLog } from './error-sanitizer.util';

/**
 * Manejador global de errores de Angular.
 *
 * <p>Captura excepciones no controladas SIN que la aplicación colapse y sin
 * exponer material sensible:</p>
 * <ul>
 *   <li>Registra en consola el error sanitizado (sin tokens ni claves).</li>
 *   <li>Activa el aviso global con un mensaje amable y genérico.</li>
 * </ul>
 * <p>Nunca debe lanzar: un ErrorHandler que falla rompe la aplicación.</p>
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly bus = inject(GlobalErrorBusService);

  handleError(error: unknown): void {
    try {
      console.error('[InkaQuest Error]', sanitizarErrorParaLog(error));
      this.bus.reportar(mensajeGlobalDeError());
    } catch {
      // Ultima linea de defensa: nunca volver a lanzar desde el manejador.
      console.error('[InkaQuest Error] fallo el manejador global.');
    }
  }
}
