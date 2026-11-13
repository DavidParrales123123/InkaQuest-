// @ts-nocheck
﻿/**
 * Fuente Ãºnica de configuraciÃ³n de la aplicaciÃ³n.
 *
 * <p>Lee los valores desde {@code environment.ts} (desarrollo) y
 * {@code environment.prod.ts} (producciÃ³n, inyectados en el build de Vercel).
 * Quedan asÃ­ en un solo lugar y no se duplican ni divergen.</p>
 *
 * <p>Las claves de Supabase son PÃšBLICAS (anon / publishable). La
 * {@code service_role} jamÃ¡s debe llegar al navegador.</p>
 */
import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface AppConfig {
  /** URL base del backend Spring Boot. */
  readonly apiUrl: string;
  /** URL del proyecto Supabase. */
  readonly supabaseUrl: string;
  /** Clave pÃºblica (anon / publishable) de Supabase. */
  readonly supabaseAnonKey: string;
  /** Nombre visible de la aplicaciÃ³n. */
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
  tagline: 'APRENDE Â· CODIFICA Â· AVANZA',
};
