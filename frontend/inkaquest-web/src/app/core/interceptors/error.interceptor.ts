// @ts-nocheck
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const SESION_EXPIRADA = 'SESION_EXPIRADA';

/**
 * Manejo centralizado de errores HTTP.
 *
 * <p>Un 401 invalida la sesion y redirige al inicio de sesion. El resto de
 * errores se propagan para que cada servicio los traduzca al mensaje que
 * corresponda a su contexto. Nunca se exponen detalles internos al usuario.</p>
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const esSesionExpirada =
        error instanceof Error && (error as Error).message === SESION_EXPIRADA;

      if (esSesionExpirada) {
        void auth.cerrarSesion().then(() =>
          router.navigate(['/login'], { queryParams: { motivo: 'sesion-expirada' } }),
        );
        return throwError(() => new Error('Tu sesion expiro. Inicia sesion nuevamente.'));
      }
      if (error instanceof HttpErrorResponse && error.status === 401) {
        void auth.cerrarSesion().then(() =>
          router.navigate(['/login'], { queryParams: { motivo: 'sesion-expirada' } }),
        );
        return throwError(() => new Error('Tu sesion expiro. Inicia sesion nuevamente.'));
      }
      return throwError(() => error);
    }),
  );
};
