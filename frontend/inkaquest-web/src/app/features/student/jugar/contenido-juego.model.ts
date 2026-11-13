// @ts-nocheck
/**
 * Contrato de contenido de los minijuegos.
 *
 * <p>El docente configura el contenido desde el modal de creación del docente;
 * el jugador estudiante lo interpreta según su forma estructural:</p>
 * <ul>
 *   <li>{@code { preguntas: [...] }} → runtime tipo quiz (pregunta, 2–6 opciones,
 *       explicación y segundos por pregunta).</li>
 *   <li>{@code { pares: [...] }} → runtime de memoria (cartas idénticas que voltean)
 *       o de emparejamiento (dos columnas a relacionar).</li>
 *   <li>{@code { generico: true, items: [...], config? }} → runtime de tarjetas
 *       de estudio: recorre los temas/items en orden y registra completado.</li>
 * </ul>
 *
 * <p>Todo lo demás se considera contenido inválido para el jugador.</p>
 */

export interface PreguntaContenido {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
  tiempoSeg?: number;
}

export interface ParContenido {
  concepto: string;
  definicion: string;
}

export interface ContenidoQuiz {
  tipo: 'quiz';
  preguntas: PreguntaContenido[];
}

export interface ContenidoPares {
  /** 'memoria' revela cartas de una en una; 'emparejamiento' usa dos columnas. */
  tipo: 'memoria' | 'emparejamiento';
  pares: ParContenido[];
}

export interface ContenidoGenerico {
  tipo: 'generico';
  items: string[];
  instrucciones: string | null;
  config: Record<string, unknown> | null;
}

export type ContenidoJuego = ContenidoQuiz | ContenidoPares | ContenidoGenerico;

/** Resultado estandarizado que cualquier runtime reporta al anfitrión. */
export interface ResultadoPartida {
  puntaje: number;
  puntajeMaximo: number;
  precision: number;
  completitud: number;
  aciertos: number;
  errores: number;
  estrellas: number;
  completado: boolean;
  desglose: Record<string, unknown>;
}

/** Calcula estrellas según el porcentaje de acierto (0–100). */
export function estrellasPorPrecision(precision: number): number {
  if (precision >= 90) return 3;
  if (precision >= 70) return 2;
  if (precision >= 50) return 1;
  return 0;
}

/**
 * Parsea el valor jsonb/valor crudo de {@code configuracion_juego.valor}.
 * Devuelve null cuando la forma no corresponde a ningún contenido conocido.
 */
export function parsearContenido(valor: unknown): ContenidoJuego | null {
  let v = valor;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;

  // ── Quiz ────────────────────────────────────────────────────────────────
  if (Array.isArray(obj['preguntas'])) {
    const preguntas: PreguntaContenido[] = [];
    for (const p of obj['preguntas'] as unknown[]) {
      if (!p || typeof p !== 'object') continue;
      const x = p as Record<string, unknown>;
      const enunciado = typeof x['pregunta'] === 'string' ? x['pregunta'].trim() : '';
      const opciones = Array.isArray(x['opciones'])
        ? (x['opciones'] as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : String(o ?? '').trim()))
        : [];
      const respuestaCorrecta =
        typeof x['respuestaCorrecta'] === 'number' ? Math.trunc(x['respuestaCorrecta']) : -1;
      const explicacion = typeof x['explicacion'] === 'string' ? x['explicacion'].trim() : '';
      if (!enunciado || opciones.length < 2 || respuestaCorrecta < 0 || respuestaCorrecta >= opciones.length) {
        continue;
      }
      if (opciones.some((o) => !o)) continue;
      const tiempoSeg =
        typeof x['tiempoSeg'] === 'number' && Number.isFinite(x['tiempoSeg']) && x['tiempoSeg'] > 0
          ? Math.trunc(x['tiempoSeg'])
          : undefined;
      preguntas.push({ pregunta: enunciado, opciones, respuestaCorrecta, explicacion, tiempoSeg });
    }
    if (preguntas.length === 0) return null;
    return { tipo: 'quiz', preguntas };
  }

  // ── Pares (memoria / emparejamiento) ────────────────────────────────────
  if (Array.isArray(obj['pares'])) {
    const pares: ParContenido[] = [];
    for (const p of obj['pares'] as unknown[]) {
      if (!p || typeof p !== 'object') continue;
      const x = p as Record<string, unknown>;
      const concepto = typeof x['concepto'] === 'string' ? x['concepto'].trim() : '';
      const definicion = typeof x['definicion'] === 'string' ? x['definicion'].trim() : '';
      if (!concepto || !definicion) continue;
      pares.push({ concepto, definicion });
    }
    if (pares.length === 0) return null;
    // El motor define la experiencia: memoria voltea cartas, emparejamiento
    // usa dos discretizadas columnas. Sin pistas del motor, se asume memoria.
    return { tipo: 'memoria', pares };
  }

  // ── Genérico (tarjetas de estudio) ──────────────────────────────────────
  if (Array.isArray(obj['items'])) {
    const items = (obj['items'] as unknown[])
      .map((i) => (typeof i === 'string' ? i.trim() : String(i ?? '').trim()))
      .filter(Boolean);
    if (items.length === 0) return null;
    const instrucciones = typeof obj['instrucciones'] === 'string' ? obj['instrucciones'].trim() : null;
    const config =
      obj['config'] && typeof obj['config'] === 'object' && !Array.isArray(obj['config'])
        ? (obj['config'] as Record<string, unknown>)
        : null;
    return { tipo: 'generico', items, instrucciones: instrucciones || null, config };
  }

  return null;
}
