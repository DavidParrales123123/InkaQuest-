/**
 * Limpia un nombre de archivo para usarlo como nombre de objeto en Storage.
 *
 * <ul>
 *   <li>Reemplaza caracteres ilegales por guiones bajos.</li>
 *   <li>Trigea y limita a 120 caracteres (sufijo alimentado a `Date.now()` aparte).</li>
 *   <li>Si queda vacío, devuelve `archivo`.</li>
 * </ul>
 */
export function sanitizarNombreArchivo(nombre: string): string {
  const limpio = (nombre || 'archivo')
    .replace(/[\\/:*?"<>|\r\n]+/g, '_')
    .trim()
    .slice(-120);
  return limpio || 'archivo';
}

/** Stem de un archivo (nombre sin extensión) para mostrar. */
export function stemDeArchivo(nombre: string): string {
  const base = sanitizarNombreArchivo(nombre);
  const punto = base.lastIndexOf('.');
  return punto <= 0 ? base : base.slice(0, punto);
}
