/**
 * Utilidades compartidas para ventanas de apertura/cierre (datetime-local).
 *
 * Los inputs `datetime-local` entregan la fecha en hora local del usuario
 * (`YYYY-MM-DDTHH:mm`); la base de datos guarda ISO UTC. Todas las validaciones
 * se hacen sobre `Date.now()` para que el criterio sea el mismo en cualquier
 * componente (tareas, evaluaciones, misiones, eventos, etc.).
 */

/** Valor mínimo para el atributo `min` de un input datetime-local: ahora. */
export function ahoraLocalInput(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** datetime-local (hora local) -> ISO UTC; null si está vacío. */
export function aIsoLocal(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

function iso(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export interface OpcionesValidacionFechas {
  etiquetaInicio?: string;
  etiquetaFin?: string;
  /** Valores ya guardados: se permiten en el pasado si el usuario no los cambia. */
  originalInicio?: string | null;
  originalFin?: string | null;
  finObligatorio?: boolean;
}

/** Error visible para un campo de fecha en el pasado (o con formato inválido). */
export function errorFechaPasada(valor: string | null | undefined, etiqueta: string): string | null {
  if (!valor) return null;
  const ms = new Date(valor).getTime();
  if (Number.isNaN(ms)) return `${etiqueta}: fecha no válida.`;
  if (ms <= Date.now()) return `${etiqueta} debe ser posterior a la hora actual (no se permite igual o anterior).`;
  return null;
}

/** Error visible cuando el cierre/límite es igual o anterior a la apertura/inicio. */
export function errorOrdenFechas(
  inicio: string | null | undefined,
  fin: string | null | undefined,
  etiquetaFin: string,
): string | null {
  if (!inicio || !fin) return null;
  const a = new Date(inicio).getTime();
  const b = new Date(fin).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return b <= a ? `${etiquetaFin} debe ser posterior a la fecha de apertura/inicio.` : null;
}

/**
 * Valida una ventana de fechas.
 * @returns mensaje de error listo para mostrar, o `null` si es válida.
 */
export function validarVentanaFechas(
  inicio: string | null | undefined,
  fin: string | null | undefined,
  opciones: OpcionesValidacionFechas = {},
): string | null {
  const iniEtiqueta = opciones.etiquetaInicio ?? 'La fecha de inicio';
  const finEtiqueta = opciones.etiquetaFin ?? 'La fecha de fin';
  const ahora = Date.now();
  const iniMs = inicio ? new Date(inicio).getTime() : null;
  const finMs = fin ? new Date(fin).getTime() : null;

  if (inicio && (iniMs === null || Number.isNaN(iniMs))) return `${iniEtiqueta} no es válida.`;
  if (fin && (finMs === null || Number.isNaN(finMs))) return `${finEtiqueta} no es válida.`;
  if (opciones.finObligatorio && finMs === null) return `Debes indicar ${finEtiqueta[0].toLowerCase() + finEtiqueta.slice(1)}.`;

  const inicioSinCambiar = !!inicio && iso(inicio) === iso(opciones.originalInicio);
  const finSinCambiar = !!fin && iso(fin) === iso(opciones.originalFin);

  if (iniMs !== null && iniMs <= ahora && !inicioSinCambiar) {
    return `${iniEtiqueta} debe ser posterior a la hora actual (no se permite igual o anterior).`;
  }
  if (finMs !== null && finMs <= ahora && !finSinCambiar) {
    return `${finEtiqueta} debe ser posterior a la hora actual (no se permite igual o anterior).`;
  }
  if (iniMs !== null && finMs !== null && finMs <= iniMs) {
    return `${finEtiqueta} debe ser posterior a ${iniEtiqueta[0].toLowerCase() + iniEtiqueta.slice(1)}.`;
  }
  return null;
}
