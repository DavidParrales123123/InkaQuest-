/**
 * Configuración de entorno (producción).
 *
 * IMPORTANTE:
 * - Este archivo se genera dinámicamente en el build de Vercel
 * - Las variables vienen de las variables de entorno de Vercel
 * - NUNCA incluir valores hardcodeados aquí
 */
export const environment = {
  production: true,
  
  /** URL del backend en producción (desde variable de entorno) */
  apiUrl: import.meta.env?.VITE_API_URL || '',
  
  /** URL de Supabase (desde variable de entorno) */
  supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || '',
  
  /** Clave pública de Supabase (desde variable de entorno) */
  supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
} as const;

// Validación de configuración en producción
if (environment.production) {
  // Verificar que todas las variables estén configuradas
  const missingVars: string[] = [];
  
  if (!environment.apiUrl) missingVars.push('VITE_API_URL');
  if (!environment.supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!environment.supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    console.error(
      '🚨 ERROR DE CONFIGURACIÓN: Variables faltantes en producción:',
      missingVars.join(', ')
    );
    console.error('Configura estas variables en el dashboard de Vercel');
  }
  
  // Verificar URLs válidas
  if (environment.apiUrl && !environment.apiUrl.startsWith('https://')) {
    console.warn('⚠️ ADVERTENCIA: API URL en producción debe usar HTTPS');
  }
  
  // Detectar claves privadas expuestas (verificación adicional)
  if (environment.supabaseAnonKey.includes('service_role')) {
    console.error('🚨 SEGURIDAD CRÍTICA: Clave privada expuesta en producción!');
    throw new Error('Configuración de seguridad inválida');
  }
}
