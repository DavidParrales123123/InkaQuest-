/**
 * Mapa de cursos a imagenes oficiales.
 *
 * <p>Cada curso se asocia a SU portada original, localizada en
 * {@code src/assets/images/courses/}. Los nombres de archivo se derivan del
 * nombre del recurso original en la carpeta de recursos visuales.</p>
 *
 * <p>La clave de identificacion es el slug del curso en la base de datos.
 * Cuando se cargue contenido real, el slug debe coincidir con esta clave o
 * se debe actualizar la tabla.</p>
 */
export const CURSO_A_IMAGEN: Record<string, string> = {
  'principios-algoritmos': 'assets/images/courses/principios-algoritmos.webp',
  'algoritmos-estructuras-datos': 'assets/images/courses/algoritmos-estructuras-datos.webp',
  'analisis-diseno-algoritmos': 'assets/images/courses/analisis-diseno-algoritmos.webp',
  'base-de-datos-1': 'assets/images/courses/base-de-datos-1.webp',
  'base-de-datos-2': 'assets/images/courses/base-de-datos-2.webp',
  'diseno-patrones': 'assets/images/courses/diseno-patrones.webp',
  'introduccion-tic': 'assets/images/courses/introduccion-tic.webp',
  'poo': 'assets/images/courses/poo.webp',
  'redes-comunicacion-datos': 'assets/images/courses/redes-comunicacion-datos.webp',
  'sistemas-operativos': 'assets/images/courses/sistemas-operativos.webp',
  'taller-programacion-java': 'assets/images/courses/taller-programacion-java.webp',
  'taller-programacion-web': 'assets/images/courses/taller-programacion-web.webp',
};

/** Imagen usada cuando un curso no tiene portada propia asignada. */
export const IMAGEN_POR_DEFECTO = 'assets/images/courses/principios-algoritmos.webp';

/**
 * Devuelve la imagen oficial de un curso.
 *
 * @param slug slug del curso
 */
export function imagenDeCurso(slug: string | null | undefined, portadaUrl?: string | null): string {
  if (portadaUrl && portadaUrl.trim()) return portadaUrl.trim();
  if (!slug) {
    return IMAGEN_POR_DEFECTO;
  }
  return CURSO_A_IMAGEN[slug] ?? IMAGEN_POR_DEFECTO;
}
