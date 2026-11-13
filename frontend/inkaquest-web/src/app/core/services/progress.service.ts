// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';

/**
 * Servicio de progreso académico.
 *
 * <p>Las lecturas se hacen directamente contra Supabase/PostgreSQL con RLS
 * (la fila propia del estudiante es visible para él; la del resto, no).</p>
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;

  // === MI PROGRESO ===

  /** Obtiene el progreso del usuario en todos sus cursos. */
  async listarMiProgreso(): Promise<ProgresoCursoResponse[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.progresoCurso)
      .select('*, curso:curso_id(titulo, slug, precio, moneda)')
      .order('actualizado_en', { ascending: false });

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
