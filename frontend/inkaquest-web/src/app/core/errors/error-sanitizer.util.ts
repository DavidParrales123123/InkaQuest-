/**
 * Sanitiza un error desconocido para registro/mostrar.
 *
 * <p>Nunca expone: tokens JWT, claves (sk_live/service_role), contraseñas,
 * ni cadenas tipo base64 largas (>80 chars).</p>
 */
export function sanitizarErrorParaLog(error: unknown): string {
  const texto = extraerMensaje(error);
  return redactar(texto);
}

/** Razón legible del error, con la ruta si es HTTP. */
export function extraerMensaje(error: unknown): string {
  if (error == null) {
    return 'Error desconocido';
  }
  if (error instanceof Error) {
    const url = (error as Error & { url?: string }).url;
    return url ? `${error.message} (${url})` : error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Quita material sensible del texto (JWT, claves, base64 largas). */
export function redactar(texto: string): string {
  return texto
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[token-omitido]')
    .replace(/(sk|pk|rk|sbp)_(live|test)_[A-Za-z0-9]{8,}/g, '[clave-omitida]')
    .replace(/service_role[^,"\s]*/gi, '[clave-omitida]')
    .replace(/password["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'password="[omitida]"')
    .replace(/[A-Za-z0-9+/]{81,}={0,2}/g, '[dato-omitido]');
}

/** Mensaje amable para el usuario, sin detalles internos. */
export function mensajeGlobalDeError(): string {
  return 'Algo salió mal en la aplicación. Vuelve a intentarlo; si el problema persiste, escribe a soporte.';
}
