// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';

/**
 * Estado de un estudiante frente a una actividad evaluable.
 *
 * - `pendiente`: no ha iniciado/entregado y todavía está dentro del plazo.
 * - `no_entregado`: no hay registro y el plazo ya venció.
 * - `en_curso`: inició el examen pero no lo entregó.
 * - `entregado`: examen entregado (con puntaje).
 * - `por_calificar`: tarea enviada, esperando nota del docente.
 * - `calificada`: tarea ya revisada.
 */
export type EstadoCalificacion =
  | 'pendiente'
  | 'no_entregado'
  | 'en_curso'
  | 'entregado'
  | 'por_calificar'
  | 'calificada';

export interface FilaCalificacion {
  estudianteId: string;
  nombre: string;
  email: string;
  estado: EstadoCalificacion;
  nota: number | null;
  notaMaxima: number | null;
  aprobado: boolean | null;
  registroId: string | null;
  numero: number | null;
  fecha: string | null;
}

/**
 * Listado tipo "calificar" (UTP+class): todos los estudiantes matriculados en
 * el curso con su situación real frente a una evaluación o una tarea.
 *
 * Solo lectura. La autorización la garantizan las políticas RLS: el docente
 * ve matrículas, perfiles de sus matriculados, intentos y entregas de sus cursos.
 */
@Injectable({ providedIn: 'root' })
export class GradebookService {
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;

  async listarRoster(
    cursoId: string,
    actividadId: string,
    tipo: 'evaluacion' | 'tarea',
  ): Promise<FilaCalificacion[]> {
    const { data: matriculas, error: errorMatriculas } = await this.client
      .from(this.supabase.tabla.matricula)
      .select('estudiante_id, estado')
      .eq('curso_id', cursoId);

    if (errorMatriculas) throw new Error(errorMatriculas.message);

    const ids = [
      ...new Set(
        (matriculas ?? [])
          .filter((m: any) => m.estado === 'activa' || m.estado === 'completada')
          .map((m: any) => m.estudiante_id as string),
      ),
    ];
    if (ids.length === 0) return [];

    const consultaRegistros = tipo === 'evaluacion'
      ? this.client
          .from(this.supabase.tabla.intentoEvaluacion)
          .select('id, estudiante_id, numero, estado, puntaje, puntaje_maximo, aprobado, tiempo_fin, creado_en')
          .eq('evaluacion_id', actividadId)
          .order('creado_en', { ascending: false })
      : this.client
          .from(this.supabase.tabla.entrega)
          .select('id, estudiante_id, estado, nota, enviada_en, creado_en')
          .eq('tarea_id', actividadId)
          .order('creado_en', { ascending: false });

    const consultaFecha = tipo === 'evaluacion'
      ? this.client.from(this.supabase.tabla.evaluacion).select('fecha_limite_acceso').eq('id', actividadId).maybeSingle()
      : this.client.from(this.supabase.tabla.tarea).select('fecha_entrega').eq('id', actividadId).maybeSingle();

    const [{ data: perfiles, error: errorPerfiles }, registros, actividad] = await Promise.all([
      this.client
        .from(this.supabase.tabla.perfil)
        .select('id, nombre, apellido, email')
        .in('id', ids),
      consultaRegistros,
      consultaFecha,
    ]);

    if (errorPerfiles) throw new Error(errorPerfiles.message);
    if (registros.error) throw new Error(registros.error.message);

    const limite = tipo === 'evaluacion'
      ? actividad.data?.fecha_limite_acceso ?? null
      : actividad.data?.fecha_entrega ?? null;
    const vencido = !!limite && new Date(limite).getTime() < Date.now();

    const filas: FilaCalificacion[] = (perfiles ?? []).map((p: any) => {
      const propio = ((registros.data ?? []) as any[]).find((r) => r.estudiante_id === p.id) ?? null;
      const base: FilaCalificacion = {
        estudianteId: p.id,
        nombre: `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || p.email,
        email: p.email ?? '',
        estado: 'pendiente',
        nota: null,
        notaMaxima: null,
        aprobado: null,
        registroId: propio?.id ?? null,
        numero: propio?.numero ?? null,
        fecha: propio?.tiempo_fin ?? propio?.enviada_en ?? propio?.creado_en ?? null,
      };

      if (tipo === 'evaluacion') {
        const estado = String(propio?.estado ?? '');
        if (estado === 'entregado' || estado === 'expirado') {
          base.estado = 'entregado';
          base.nota = propio.puntaje ?? null;
          base.notaMaxima = propio.puntaje_maximo ?? null;
          base.aprobado = propio.aprobado ?? null;
        } else if (estado === 'iniciado' || estado === 'en_curso') {
          base.estado = 'en_curso';
        } else if (vencido) {
          base.estado = 'no_entregado';
        }
      } else {
        const estado = String(propio?.estado ?? '');
        if (estado === 'revisada') {
          base.estado = 'calificada';
          base.nota = propio.nota ?? null;
          base.notaMaxima = 20;
        } else if (['enviado', 'en_revision', 'devuelta'].includes(estado)) {
          base.estado = 'por_calificar';
        } else if (vencido) {
          base.estado = 'no_entregado';
        }
      }
      return base;
    });

    const prioridad: Record<EstadoCalificacion, number> = {
      por_calificar: 0,
      no_entregado: 1,
      en_curso: 2,
      pendiente: 3,
      entregado: 4,
      calificada: 5,
    };
    return filas.sort((a, b) =>
      (prioridad[a.estado] - prioridad[b.estado]) || a.nombre.localeCompare(b.nombre),
    );
  }
}
