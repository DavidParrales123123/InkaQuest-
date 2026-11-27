// @ts-nocheck
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, throwError, timer } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';

/**
 * Cliente HTTP del backend Spring Boot.
 *
 * <p>Centraliza la URL base, el token de sesion (via
 * {@code authInterceptor}) y la traduccion de errores HTTP a mensajes
 * comprensibles para el usuario. Los dominios migrados consumen REST; Auth
 * permanece en Supabase y Storage se usa para archivos. Los servicios de
 * dominio pendientes se migran cuando exista su endpoint equivalente.</p>
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  /** URL base de la API, sin barra final. */
  readonly baseUrl = this.config.apiUrl.replace(/\/$/, '');

  /** Ejecuta una peticion GET contra el backend. */
  get<T>(ruta: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http
      .get<unknown>(`${this.baseUrl}${ruta}`, { params })
      .pipe(this.reintentar(), map((respuesta) => this.desenvolver<T>(respuesta)), catchError((error: unknown) => this.traducir(error)));
  }

  /** Ejecuta una peticion POST contra el backend. */
  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http
      .post<unknown>(`${this.baseUrl}${ruta}`, cuerpo)
      .pipe(this.reintentar(), map((respuesta) => this.desenvolver<T>(respuesta)), catchError((error: unknown) => this.traducir(error)));
  }

  /** Ejecuta una peticion PUT contra el backend. */
  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http
      .put<unknown>(`${this.baseUrl}${ruta}`, cuerpo)
      .pipe(this.reintentar(), map((respuesta) => this.desenvolver<T>(respuesta)), catchError((error: unknown) => this.traducir(error)));
  }

  /** Ejecuta una peticion PATCH contra el backend. */
  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http
      .patch<unknown>(`${this.baseUrl}${ruta}`, cuerpo)
      .pipe(this.reintentar(), map((respuesta) => this.desenvolver<T>(respuesta)), catchError((error: unknown) => this.traducir(error)));
  }

  /** Ejecuta una peticion DELETE contra el backend. */
  delete<T>(ruta: string): Observable<T> {
    return this.http
      .delete<unknown>(`${this.baseUrl}${ruta}`)
      .pipe(this.reintentar(), map((respuesta) => this.desenvolver<T>(respuesta)), catchError((error: unknown) => this.traducir(error)));
  }

  /**
   * Ante 429/503 espera y reintenta como máximo 2 veces. Evita que un pico
   * de tráfico o un ataque provoque un temporal de peticiones desde el navegador.
   */
  private reintentar() {
    return retry({
      count: 2,
      delay: (error: unknown, intento: number) => {
        const e = error as HttpErrorResponse;
        if (e?.status !== 429 && e?.status !== 503) return throwError(() => error);
        const cabecera = Number(e.headers?.get('Retry-After'));
        const segundos = Number.isFinite(cabecera) && cabecera > 0
          ? Math.min(cabecera, 5) : intento;
        return timer(segundos * 1000);
      },
    });
  }

  /** Desenvuelve ApiResponse del backend y conserva compatibilidad con respuestas antiguas. */
  private desenvolver<T>(respuesta: unknown): T {
    if (respuesta !== null && typeof respuesta === 'object' && 'success' in respuesta) {
      const api = respuesta as { success?: boolean; data?: T; message?: string };
      if (api.success === false) {
        throw new Error(api.message ?? 'La operacion no pudo completarse.');
      }
      if (api.success === true) return api.data as T;
    }
    return respuesta as T;
  }

  /**
   * Traduce un error HTTP a un mensaje legible, sin filtrar detalles internos.
   */
  private traducir(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const cuerpo = error.error as { message?: string; error?: string } | null;
      const mensaje =
        cuerpo?.message ??
        (error.status === 0
          ? 'No se pudo conectar con el servidor. Verifica tu conexion.'
          : 'La operacion no pudo completarse. Intentalo de nuevo.');

      if (error.status === 0) {
        return throwError(
          () => new Error('No se pudo conectar con el servidor. Verifica tu conexion.'),
        );
      }
      if (error.status === 429) {
        return throwError(
          () => new Error('Demasiadas peticiones. Espera un momento e intentalo de nuevo.'),
        );
      }
      return throwError(() => new Error(mensaje));
    }
    if (error instanceof Error) return throwError(() => error);
    return throwError(() => new Error('Error inesperado.'));
  }
}
