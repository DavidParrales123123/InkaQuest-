import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas que requieren sesion activa.
 *
 * <p>Si no hay sesion, redirige al inicio de sesion conservando la URL de
 * destino para volver a ella tras autenticarse.</p>
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Se espera a que se resuelva la sesion inicial antes de decidir (con timeout de seguridad).
  if (auth.cargando()) {
    await new Promise<void>((resolver) => {
      const inicio = Date.now();
      const intervalo = setInterval(() => {
        if (!auth.cargando() || Date.now() - inicio > 10000) {
          clearInterval(intervalo);
          resolver();
        }
      }, 50);
    });
  }

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { retorno: state.url },
  });
};

/**
 * Protege las rutas de rol concreto.
 *
 * <p>Es una capa de experiencia de usuario: la autorizacion real la aplican
 * Spring Security y las politicas RLS. Si un usuario manipula la ruta desde
 * el navegador, el backend seguira negando el acceso a los datos.</p>
 */
export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.cargando()) {
    await new Promise<void>((resolver) => {
      const inicio = Date.now();
      const intervalo = setInterval(() => {
        if (!auth.cargando() || Date.now() - inicio > 10000) {
          clearInterval(intervalo);
          resolver();
        }
      }, 50);
    });
  }

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rolesRequeridos = (route.data?.['roles'] ?? []) as string[];
  if (rolesRequeridos.length === 0) {
    return true;
  }

  let rolActual = auth.rol();
  if (!rolActual) {
    // El perfil puede no haberse cargado/cargado aún o no existir (p. ej. tras confirmar correo).
    await auth.cargarPerfil();
    rolActual = auth.rol();
    if (!rolActual && auth.autenticado()) {
      await auth.asegurarPerfilBasico();
      await auth.cargarPerfil();
      rolActual = auth.rol();
    }
  }
  if (rolActual && rolesRequeridos.includes(rolActual)) {
    return true;
  }

  // Rol insuficiente: se lleva a su panel correspondiente.
  return router.createUrlTree([rutaInicioPorRol(rolActual)]);
};

/**
 * Ruta de inicio segun el rol del usuario.
 */
export function rutaInicioPorRol(rol: string | null): string {
  switch (rol) {
    case 'administrador':
      return '/admin/dashboard';
    case 'docente':
      return '/docente/dashboard';
    case 'estudiante':
      return '/estudiante/dashboard';
    default:
      return '/';
  }
}
