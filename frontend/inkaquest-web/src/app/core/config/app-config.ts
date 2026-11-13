// @ts-nocheck
/**
 * Fuente única de configuración de la aplicación.
 *
 * <p>Lee los valores desde {@code environment.ts} (desarrollo) y
 * {@code environment.prod.ts} (producción, inyectados en el build de Vercel).
 * Quedan así en un solo lugar y no se duplican ni divergen.</p>
 *
 * <p>Las claves de Supabase son PÚBLICAS (anon / publishable). La
 * {@code service_role} jamás debe llegar al navegador.</p>
 */
import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface AppConfig {
  /** URL base del backend Spring Boot. */
  readonly apiUrl: string;
  /** URL del proyecto Supabase. */
  readonly supabaseUrl: string;
  /** Clave pública (anon / publishable) de Supabase. */
  readonly supabaseAnonKey: string;
  /** Nombre visible de la aplicación. */
  readonly appName: string;
  /** Lema institucional. */
  readonly tagline: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export const APP_CONFIG_VALUE: AppConfig = {
  apiUrl: environment.apiUrl,
  supabaseUrl: environment.supabaseUrl,
  supabaseAnonKey: environment.supabaseAnonKey,
  appName: 'InkaQuest',
  tagline: 'APRENDE · CODIFICA · AVANZA',
};
