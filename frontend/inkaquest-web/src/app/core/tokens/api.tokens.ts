import { InjectionToken } from '@angular/core';

/**
 * Token de inyección para la URL base de la API del backend (Spring Boot).
 *
 * Se inyecta desde `app.config.ts` usando la configuración del entorno activo,
 * de modo que los servicios no dependen de variables de entorno de forma directa.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
