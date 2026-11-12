/**
 * Respuesta estándar del backend API.
 *
 * Todas las respuestas del backend siguen este formato:
 * - success: indica si la operación fue exitosa
 * - message: mensaje descriptivo
 * - data: payload de datos (puede ser null en caso de error)
 * - errors: lista de errores de validación (opcional)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
