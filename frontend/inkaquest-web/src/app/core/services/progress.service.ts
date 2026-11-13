// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

/**
 * Servicio de progreso académico.
 *
 * <p>Las lecturas se hacen directamente contra Supabase/PostgreSQL con RLS
 * (la fila propia del estudiante es visible para él; la del resto, no).</p>
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly auth = inject(AuthService);

  // === MI PROGRESO ===

  /** Obtiene el progreso del usuario autenticado en todos sus cursos. */
  async listarMiProgreso(): Promise<ProgresoCursoResponse[]> {
    let consulta = this.client
      .from(this.supabase.tabla.progresoCurso)
      .select('*, curso:curso_id(titulo, slug, precio, moneda)')
      .order('actualizado_en', { ascending: false });

    // La RLS permite a administradores/docentes ver progreso ajeno, pero en las
    // vistas de estudiante nos limitamos al propio usuario.
    const uid = this.auth.usuario()?.id ?? '00000000-0000-0000-0000-000000000000';
    consulta = consulta.eq('estudiante_id', uid);

    const { data, error } = await consulta;

    if (error) {
      console.error('[InkaQuest] Error cargando el progreso:', error.message);
      throw new Error('No se pudo cargar tu progreso.');
    }

    return (data ?? []).map((p: any) => this.normalizarProgreso(p));
  }

  /** Progreso de lecciones del curso (fila más reciente). */
  async listarProgresoLecciones(progresoCursoId: string): Promise<ProgresoLeccionResponse[]> {
    if (!progresoCursoId) return [];
    const { data, error } = await this.client
      .from(this.supabase.tabla.progresoLeccion)
      .select('*')
      .eq('progreso_curso_id', progresoCursoId)
      .order('leccion_id', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando las lecciones del curso:', error.message);
      return [];
    }
    return (data ?? []) as ProgresoLeccionResponse[];
  }

  /** Obtiene el progreso de un curso específico. */
  async obtenerProgresoCurso(cursoId: string): Promise<ProgresoCursoResponse | null> {
    const progresos = await this.listarMiProgreso();
    return progresos.find((p) => (p.curso_id ?? p.cursoId) === cursoId) || null;
  }

  /** Marca una lección como completada. Devuelve el % del curso tras el registro. */
  async registrarLeccionCompletada(
    _estudianteId: string,
    _cursoId: string,
    leccionId: string,
    _xpOtorgado: number = 0,
  ): Promise<number> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<LeccionCompletadaResponse>>(
        `${environment.apiUrl}/progreso/lecciones/${leccionId}/completar`,
        {},
      ),
    );
    const datos: any = res.data || {};
    return Number(datos.porcentajeCurso ?? datos.porcentaje ?? 0);
  }

  /** Normaliza la fila de progreso_curso (snake) a la forma usada por la UI. */
  private normalizarProgreso(p: any): ProgresoCursoResponse {
    const curso = p?.curso ?? null;
    return {
      id: p?.id,
      cursoId: p?.curso_id,
      curso_id: p?.curso_id,
      curso: curso
        ? { id: p?.curso_id, ...curso }
        : null,
      cursoTitulo: curso?.titulo ?? '',
      estudianteId: p?.estudiante_id,
      estudiante_id: p?.estudiante_id,
      porcentajeCompletado: p?.porcentaje ?? 0,
      porcentaje: p?.porcentaje ?? 0,
      leccionesCompletadas: p?.lecciones_completadas ?? 0,
      lecciones_completadas: p?.lecciones_completadas ?? 0,
      leccionesTotales: 0,
      estado: p?.estado,
      minutosEstudio: p?.minutos_estudio ?? 0,
      minutos_estudio: p?.minutos_estudio ?? 0,
      xpGanado: 0,
      ultimaActividadEn: p?.ultima_actividad_en ?? null,
      creadoEn: p?.creado_en,
      actualizadoEn: p?.actualizado_en,
    } as ProgresoCursoResponse;
  }
}

// === INTERFACES ===

export interface ProgresoCursoResponse {
  id: string;
  cursoId: string;
  curso_id: string;
  curso: { id: string; titulo?: string; slug?: string; precio?: number; moneda?: string } | null;
  cursoTitulo: string;
  estudianteId: string;
  estudiante_id: string;
  porcentajeCompletado: number;
  porcentaje: number;
  leccionesCompletadas: number;
  lecciones_completadas: number;
  leccionesTotales: number;
  estado: string;
  minutosEstudio: number;
  minutos_estudio: number;
  xpGanado: number;
  ultimaActividadEn: string | null;
  creadoEn: string;
  actualizadoEn: string | null;
}

export interface ProgresoLeccionResponse {
  id: string;
  progreso_curso_id: string;
  leccion_id: string;
  estudiante_id: string;
  estado: string;
  porcentaje: number;
  xp_obtenido: number;
  minutos_estudio: number;
  completado_en: string | null;
}

export interface LeccionCompletadaResponse {
  leccionId: string;
  xpOtorgado: number;
  leccionesCompletadas: number;
  totalLeccionesPublicadas: number;
  porcentajeCurso: number;
  cursoCompletado: boolean;
}
