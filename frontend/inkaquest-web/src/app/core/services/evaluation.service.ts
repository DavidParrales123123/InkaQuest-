// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import { Actividad, Evaluacion, IntentoEvaluacion, Opcion, Pregunta } from '../models/domain.models';

/**
 * Servicio de evaluaciones (examenes y cuestionarios).
 *
 * Consume el backend REST API para:
 * - Listar evaluaciones disponibles
 * - Iniciar intentos de evaluación
 * - Enviar respuestas
 * - Consultar resultados
 */
@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly baseUrl = `${environment.apiUrl}/evaluaciones`;

  // === EVALUACIONES (Supabase + RLS) ===

  /** Evaluaciones publicadas del curso, con su actividad embebida. */
  async listarEvaluacionesCurso(cursoId: string): Promise<(Evaluacion & { actividad: Actividad })[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.evaluacion)
      .select('*, actividad:actividad_id!inner(*)')
      .eq('actividad.curso_id', cursoId)
      .eq('actividad.publicado', true)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando evaluaciones:', error.message);
      return [];
    }
    return (data ?? []) as (Evaluacion & { actividad: Actividad })[];
  }

  /** Intentos registrados por el estudiante en una evaluación. */
  async listarIntentos(evaluacionId: string, estudianteId?: string): Promise<IntentoEvaluacion[]> {
    let consulta = this.client
      .from(this.supabase.tabla.intentoEvaluacion)
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .order('creado_en', { ascending: false });

    if (estudianteId) consulta = consulta.eq('estudiante_id', estudianteId);

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando intentos:', error.message);
      return [];
    }
    return (data ?? []) as IntentoEvaluacion[];
  }

  // === EVALUACIONES ===

  /** Lista evaluaciones con filtros opcionales. */
  async listarEvaluaciones(cursoId?: string, tipo?: string): Promise<EvaluacionResponse[]> {
    const params: any = {};
    if (cursoId) params.cursoId = cursoId;
    if (tipo) params.tipo = tipo;

    const res = await firstValueFrom(
      this.http.get<ApiResponse<EvaluacionResponse[]>>(this.baseUrl, { params })
    );
    return res.data || [];
  }

  /** Obtiene el detalle de una evaluación con sus preguntas. */
  async obtenerEvaluacion(id: string): Promise<EvaluacionDetalleResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<EvaluacionDetalleResponse>>(`${this.baseUrl}/${id}`)
    );
    return res.data!;
  }

  // === INTENTOS ===

  /** Inicia un nuevo intento de evaluación. */
  async iniciarIntento(evaluacionId: string): Promise<IniciarIntentoResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<IniciarIntentoResponse>>(
        `${this.baseUrl}/${evaluacionId}/iniciar`,
        {}
      )
    );
    return res.data!;
  }

  // === GESTIÓN DOCENTE (Supabase + RLS) ===
  // Las políticas pol_* validan en servidor que el autor sea el docente del
  // curso o un admin; el frontend no es fuente de confianza.

  /** Lista las evaluaciones del curso (todas, incl. borradores) para el panel del docente. */
  async listarEvaluacionesGestion(cursoId: string): Promise<(Evaluacion & { actividad: Actividad })[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.evaluacion)
      .select('*, actividad:actividad_id!inner(*)')
      .eq('actividad.curso_id', cursoId)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('[InkaQuest] Error listando evaluaciones de gestión:', error.message);
      throw new Error(error.message);
    }
    return (data ?? []) as (Evaluacion & { actividad: Actividad })[];
  }

  /** Crea una evaluación (quiz/examen) en una lección con su actividad contenedora. Devuelve la creada para enlazar preguntas. */
  async crearEvaluacion(input: {
    cursoId: string;
    leccionId: string;
    titulo: string;
    tipo?: string;
    instrucciones?: string | null;
    tiempoLimiteMinutos?: number | null;
    intentosPermitidos?: number;
    porcentajeAprobacion?: number;
    xpOtorgado?: number;
    publicado?: boolean;
  }): Promise<Evaluacion & { actividad: Actividad }> {
    const tiempo = Number.isFinite(input.tiempoLimiteMinutos as number) && (input.tiempoLimiteMinutos as number) > 0 ? Number(input.tiempoLimiteMinutos) : null;
    const intentos = Math.max(1, input.intentosPermitidos ?? 1);
    const titulo = input.titulo.trim();

    const { data: act, error: actividadError } = await this.client
      .from(this.supabase.tabla.actividad)
      .insert({
        leccion_id: input.leccionId,
        curso_id: input.cursoId,
        tipo: (input.tipo?.trim() || 'quiz') as Actividad['tipo'],
        titulo,
        instrucciones: input.instrucciones ?? null,
        tiempo_limite_minutos: tiempo,
        intentos_permitidos: intentos,
        publicado: !!input.publicado,
        xp_otorgado: input.xpOtorgado ?? 0,
      })
      .select()
      .single();

    if (actividadError || !act) {
      console.error('[InkaQuest] Error creando la actividad de la evaluación:', actividadError?.message);
      throw new Error(actividadError?.message ?? 'No se pudo crear la actividad.');
    }

    const { data: ev, error: evaluacionError } = await this.client
      .from(this.supabase.tabla.evaluacion)
      .insert({
        actividad_id: act.id,
        titulo,
        duracion_minutos: tiempo,
        intentos_permitidos: intentos,
        porcentaje_aprobacion: input.porcentajeAprobacion ?? 60,
        mostrar_resultado_inmediato: true,
      })
      .select()
      .single();

    if (evaluacionError || !ev) {
      // Rollback best effort: borra la actividad huérfana.
      await this.client.from(this.supabase.tabla.actividad).delete().eq('id', act.id).catch(() => undefined);
      console.error('[InkaQuest] Error creando la evaluación:', evaluacionError?.message);
      throw new Error(evaluacionError?.message ?? 'No se pudo crear la evaluación.');
    }

    return { ...(ev as Evaluacion), actividad: act as Actividad };
  }

  /** Cambia el estado de publicación de la actividad contenedora. */
  async togglePublicada(actividadId: string, publicado: boolean): Promise<void> {
    const { error } = await this.client
      .from(this.supabase.tabla.actividad)
      .update({ publicado: !!publicado })
      .eq('id', actividadId);
    if (error) {
      console.error('[InkaQuest] Error alternando la publicación:', error.message);
      throw new Error(error.message);
    }
  }

  /** Elimina una evaluación; la actividad contenedora cascada borra evaluación, preguntas y opciones. */
  async eliminarEvaluacion(actividadId: string, _evaluacionId?: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.actividad).delete().eq('id', actividadId);
    if (error) {
      console.error('[InkaQuest] Error eliminando la evaluación:', error.message);
      throw new Error(error.message);
    }
  }

  /** Lista las preguntas de una evaluación con sus opciones, ordenadas por `orden`. */
  async listarPreguntasConOpciones(evaluacionId: string): Promise<(Pregunta & { opciones: Opcion[] })[]> {
    const { data: preguntas, error } = await this.client
      .from(this.supabase.tabla.pregunta)
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error listando preguntas:', error.message);
      throw new Error(error.message);
    }

    const qs = (preguntas ?? []) as Pregunta[];
    const ids = qs.map((p) => p.id);
    if (ids.length === 0) return [];

    const { data: opciones, error: opcionesError } = await this.client
      .from(this.supabase.tabla.opcion)
      .select('*')
      .in('pregunta_id', ids)
      .order('orden', { ascending: true });

    if (opcionesError) {
      console.error('[InkaQuest] Error listando opciones:', opcionesError.message);
      throw new Error(opcionesError.message);
    }

    const porPregunta = new Map<string, Opcion[]>();
    for (const o of (opciones ?? []) as Opcion[]) {
      const arr = porPregunta.get(o.pregunta_id) ?? [];
      arr.push(o);
      porPregunta.set(o.pregunta_id, arr);
    }
    return qs.map((p) => ({ ...p, opciones: porPregunta.get(p.id) ?? [] }));
  }

  /** Agrega una pregunta de opción (verdadero_falso / opcion_unica) con sus opciones, marcando la correcta. */
  async agregarPregunta(input: {
    evaluacionId: string;
    orden: number;
    tipo: string;
    enunciado: string;
    retroalimentacion?: string | null;
    opciones: string[];
    respuestaCorrecta: number;
    puntos?: number;
  }): Promise<void> {
    if (!Array.isArray(input.opciones) || input.opciones.length === 0) {
      throw new Error('La pregunta necesita al menos una opción.');
    }

    const { data: pregunta, error } = await this.client
      .from(this.supabase.tabla.pregunta)
      .insert({
        evaluacion_id: input.evaluacionId,
        orden: Math.max(1, input.orden),
        tipo: (input.tipo?.trim() || 'opcion_unica') as Pregunta['tipo'],
        enunciado: input.enunciado.trim(),
        retroalimentacion: input.retroalimentacion?.trim() || null,
        puntos: input.puntos ?? 1,
      })
      .select()
      .single();

    if (error || !pregunta) {
      console.error('[InkaQuest] Error creando la pregunta:', error?.message);
      throw new Error(error?.message ?? 'No se pudo crear la pregunta.');
    }

    const opciones = input.opciones.map((texto, i) => ({
      pregunta_id: pregunta.id,
      orden: i + 1,
      texto,
      es_correcta: i === input.respuestaCorrecta,
    }));

    const { error: opcionesError } = await this.client.from(this.supabase.tabla.opcion).insert(opciones);
    if (opcionesError) {
      // Rollback best effort.
      await this.client.from(this.supabase.tabla.pregunta).delete().eq('id', pregunta.id).catch(() => undefined);
      console.error('[InkaQuest] Error creando las opciones:', opcionesError.message);
      throw new Error(opcionesError.message);
    }
  }

  /** Elimina una pregunta (cascada a opciones/respuestas). */
  async eliminarPregunta(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.pregunta).delete().eq('id', id);
    if (error) {
      console.error('[InkaQuest] Error eliminando la pregunta:', error.message);
      throw new Error(error.message);
    }
  }

  /** Envía una respuesta a una pregunta del intento. */
  async responderPregunta(
    intentoId: string,
    preguntaId: string,
    respuesta: string | string[]
  ): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<void>>(
        `${environment.apiUrl}/intentos/${intentoId}/responder`,
        {
          preguntaId,
          respuesta: Array.isArray(respuesta) ? respuesta : [respuesta]
        }
      )
    );
  }

  /** Obtiene el resultado de un intento finalizado. */
  async obtenerResultado(intentoId: string): Promise<ResultadoIntentoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<ResultadoIntentoResponse>>(
        `${environment.apiUrl}/intentos/${intentoId}/resultado`
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface EvaluacionResponse {
  id: string;
  titulo: string;
  descripcion: string;
  duracionMinutos: number | null;
  intentosPermitidos: number;
  intentosRealizados: number;
  notaMaxima: number;
  porcentajeAprobacion: number;
  tipo: string;
  publicado: boolean;
}

export interface EvaluacionDetalleResponse {
  id: string;
  titulo: string;
  descripcion: string;
  instrucciones: string | null;
  duracionMinutos: number | null;
  intentosPermitidos: number;
  intentosRealizados: number;
  notaMaxima: number;
  porcentajeAprobacion: number;
  aleatorizarPreguntas: boolean;
  mostrarResultadoInmediato: boolean;
  preguntas: PreguntaResponse[];
  misIntentos: IntentoResponse[];
}

export interface PreguntaResponse {
  id: string;
  orden: number;
  tipo: string;
  enunciado: string;
  puntos: number;
  opciones: OpcionResponse[];
  retroalimentacion: string | null;
}

export interface OpcionResponse {
  id: string;
  orden: number;
  texto: string;
}

export interface IntentoResponse {
  id: string;
  numero: number;
  estado: string;
  puntaje: number | null;
  puntajeMaximo: number | null;
  tiempoInicio: string;
  tiempoFin: string | null;
  aprobado: boolean | null;
}

export interface IniciarIntentoResponse {
  intentoId: string;
  evaluacionId: string;
  numero: number;
  tiempoInicio: string;
  tiempoLimite: string | null;
  preguntas: PreguntaResponse[];
}

export interface ResultadoIntentoResponse {
  intentoId: string;
  evaluacionId: string;
  numero: number;
  puntaje: number;
  puntajeMaximo: number;
  porcentaje: number;
  aprobado: boolean;
  tiempoInicio: string;
  tiempoFin: string;
  respuestas: RespuestaResultadoResponse[];
}

export interface RespuestaResultadoResponse {
  preguntaId: string;
  enunciado: string;
  tipo: string;
  puntos: number;
  puntajeObtenido: number;
  correcta: boolean;
  respuestaEstudiante: string[];
  respuestaCorrecta: string[];
  retroalimentacion: string | null;
}
