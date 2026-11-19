/**
 * Detecta si un recurso de leccion es un PDF para poder mostrarlo con vista previa
 * inline en el aula del estudiante en lugar de solo ofrecer descarga.
 *
 * Se fija en mime_type, tipo y nombre (extension .pdf) porque los datos llegan
 * de distintas pantallas (docente sube, admin edita) y no siempre van todos rellenos.
 */
import { Recurso } from '../../core/models/domain.models';

export function esPdfRecurso(r: Recurso): boolean {
  const mime = (r.mime_type || '').toLowerCase();
  const tipo = (r.tipo || '').toLowerCase();
  const nombre = (r.nombre || '').toLowerCase();
  return mime === 'application/pdf' || tipo === 'pdf' || nombre.endsWith('.pdf');
}
