// @ts-nocheck
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { SupabaseService } from '../services/supabase.service';

/** Propagacion de errores de autenticacion para que el errorInterceptor rediriga. */
const SIN_SESION = new Error('SESION_EXPIRADA');

/**
 * Adjunta el token de sesion a las peticiones del backend.
 *
 * <p>El token lo emite Supabase Auth. El frontend NO decide autorizacion ni
 * rol: solo presenta la credencial. Este interceptor valida la vigencia del
 * JWT (con margen de 30 s) y renueva la sesion si es necesario; si no hay
 * sesion vigente, se lanza el error de expiracion y el errorInterceptor
 * redirige al login.</p>
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Las llamadas a la API propia de Supabase ya llevan su propia cabecera.
  if (req.url.includes('supabase.co')) {
    return next(req);
  }

  // Endpoints públicos que NO requieren autenticación
  const publicEndpoints = ['/cursos', '/categorias'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  const supabase = inject(SupabaseService);

  return from(supabase.client.auth.getSession()).pipe(
    switchMap(({ data }) => {
      const session = data.session;
      if (!session) {
        // Si no hay sesión pero es un endpoint público, continuar sin token
        if (isPublicEndpoint) {
          return next(req);
        }
        // Sin sesion en endpoint privado: no se envia la peticion sin credencial.
        return from(Promise.reject(SIN_SESION));
      }
      const ahora = Math.floor(Date.now() / 1000);
      const expira = session.expires_at ?? 0;
      if (expira > 0 && expira <= ahora + 30) {
        // Casi expirada: intenta renovar una sola vez.
        return from(supabase.client.auth.refreshSession()).pipe(
          switchMap(({ data: refrescada, error }) => {
            if (error || !refrescada.session) {
              return from(Promise.reject(SIN_SESION));
            }
            return next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${refrescada.session.access_token}` },
              }),
            );
          }),
        );
      }
      return next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${session.access_token}` },
        }),
      );
    }),
  );
};
