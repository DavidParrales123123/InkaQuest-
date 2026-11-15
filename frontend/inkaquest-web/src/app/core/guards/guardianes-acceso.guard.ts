// @ts-nocheck
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { GuardianesAccesoService } from '../services/guardianes-acceso.service';

/**
 * Protege las rutas del videojuego en el módulo de estudiante.
 * Solo puede entrar quien esté matriculado en Principios de Algoritmos.
 */
export const guardianesEstudianteGuard: CanActivateFn = async () => {
  const acceso = inject(GuardianesAccesoService);
  const router = inject(Router);
  const ok = await acceso.tieneAccesoEstudiante();
  return ok ? true : router.createUrlTree(['/estudiante/dashboard']);
};

/**
 * Protege la ruta del panel docente de seguimiento.
 * Solo puede entrar un docente asignado y activo del curso.
 */
export const guardianesDocenteGuard: CanActivateFn = async () => {
  const acceso = inject(GuardianesAccesoService);
  const router = inject(Router);
  const ok = await acceso.tieneAccesoDocente();
  return ok ? true : router.createUrlTree(['/docente/dashboard']);
};
