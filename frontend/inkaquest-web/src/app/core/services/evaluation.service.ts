// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import { Actividad, Evaluacion, IntentoEvaluacion } from '../models/domain.models';

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
