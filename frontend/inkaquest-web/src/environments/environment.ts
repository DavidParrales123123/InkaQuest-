/**
 * Configuración de entorno (desarrollo).
 *
 * SEGURIDAD:
 * - Solo claves PÚBLICAS (anon/publishable)
 * - NUNCA service_role ni API keys privadas
 * - La RLS de PostgreSQL protege los datos
 * - JWT validado en backend contra JWKS
 */
export const environment = {
  production: false,
  
  /** URL base del backend Spring Boot (sin trailing slash) */
  apiUrl: 'http://localhost:8080/api/v1',
  
  /** URL del proyecto Supabase (solo para Auth) */
  supabaseUrl: 'https://nrfdifzechrjikrvzhdl.supabase.co',
  
  /** Clave pública (anon) de Supabase - SEGURA en navegador */
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmRpZnplY2hyamlrcnZ6aGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMjY4NTUsImV4cCI6MjEwOTkwMjg1NX0.l_MirIPpG8xkKCIuh5wMqAIth1jUfIT3A5vcNLS2yv0',
} as const;

// Validación en desarrollo para detectar configuración incorrecta
if (!environment.production) {
  if (!environment.apiUrl) {
    console.warn('⚠️ API URL no configurada. Revisa environment.ts');
  }
  if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
    console.warn('⚠️ Configuración de Supabase incompleta');
  }
  // Detectar claves privadas expuestas (NUNCA deben estar aquí)
  if (environment.supabaseAnonKey.includes('service_role')) {
    console.error('🚨 SEGURIDAD: service_role_key expuesta en frontend! ELIMINAR INMEDIATAMENTE');
  }
}
