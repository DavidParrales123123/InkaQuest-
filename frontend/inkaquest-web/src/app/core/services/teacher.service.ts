// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import {
  Actividad,
  Calificacion,
  Curso,
  DocenteCurso,
  Entrega,
  Perfil,
  SolicitudDocente,
  Tarea,
} from '../models/domain.models';

/**
 * Servicio del panel docente.
 *
 * <p>Un docente solo puede administering los cursos que tiene asignados en
 * {@code docente_curso}: la RLS usa {@code app_es_docente_del_curso()} para
 * filtrar lecturas y escrituras.</p>
 */
@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Excluye filas cuyo estudiante sea un administrador (ellos no deben
   * aparecer en ningún apartado del docente ni del estudiante). Fail-safe:
   * ante error de red devuelve las filas tal cual (no bloquea la vista).
   */
  private async descartarPerfilesAdmin(filas: Entrega[]): Promise<Entrega[]> {
    if (!filas.length) return filas;
    const estudianteIds = [...new Set(filas.map((f) => f.estudiante_id).filter(Boolean))] as string[];
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('id')
      .in('id', estudianteIds)
      .eq('rol', 'administrador');
    if (error) return filas;
    const admins = new Set((data ?? []).map((p: any) => p.id));
    return filas.filter((f) => !admins.has(f.estudiante_id));
  }

  /* ----------------------------------------------------- Solicitudes --- */

  /**
   * Envia la solicitud de acceso como docente.
   *
   * <p>La RLS solo permite insertar si el rol actual es 'estudiante' y el
   * {@code usuario_id} es el propio: un usuario nunca se autoasigna el rol de
   * docente.</p>
   */
  async solicitarAccesoDocente(
    usuarioId: string,
    datos: {
      institucion: string;
      especialidad: string;
      codigoDocente: string;
      motivo: string;
    },
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const existente = await this.obtenerMiSolicitud(usuarioId);
      if (existente && (existente.estado === 'pendiente' || existente.estado === 'en_revision' || existente.estado === 'aprobada')) {
        return { ok: false, mensaje: 'Ya existe una solicitud registrada para tu cuenta.' };
      }

      const base = {
        usuario_id: usuarioId,
        institucion: datos.institucion,
        especialidad: datos.especialidad,
        codigo_docente: datos.codigoDocente ?? '',
        motivo: datos.motivo,
        estado: 'pendiente' as const,
        documentos_adjuntos: null,
      };

      let { error } = await this.supabase.client
        .from(this.supabase.tabla.solicitudDocente)
        .insert(base);

      if (error) {
        const retry = await this.supabase.client
          .from(this.supabase.tabla.solicitudDocente)
          .insert({
            usuario_id: usuarioId,
            institucion: datos.institucion,
            especialidad: datos.especialidad,
            motivo: datos.motivo,
            estado: 'pendiente',
          } as any);
        error = retry.error;
      }

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return {
        ok: true,
        mensaje:
          'Solicitud enviada correctamente. Un administrador la revisará y, si es aprobada, se te asignará el rol docente.',
      };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo enviar la solicitud.',
      };
    }
  }

  /** Solicitud del usuario actual, si existe. */
  async obtenerMiSolicitud(usuarioId: string): Promise<SolicitudDocente | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.solicitudDocente)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }
    return (data as SolicitudDocente) ?? null;
  }

  /* ---------------------------------------------------------- Cursos --- */

  /** Cursos asignados al docente. */
  async listarMisCursos(docenteId: string): Promise<(DocenteCurso & { curso: Curso })[]> {
    const { data: asignaciones, error: errorAsignaciones } = await this.supabase.client
      .from(this.supabase.tabla.docenteCurso)
      .select('*')
      .eq('docente_id', docenteId)
      .eq('activo', true);

    if (errorAsignaciones) {
      throw new Error(errorAsignaciones.message);
    }

    const filas = (asignaciones ?? []) as DocenteCurso[];
    if (filas.length === 0) {
      return [];
    }

    const { data: cursosRaw, error: errorCursos } = await this.supabase.client
      .from(this.supabase.tabla.curso)
      .select('*')
      .in(
        'id',
        filas.map((a) => a.curso_id),
      );

    if (errorCursos) {
      throw new Error(errorCursos.message);
    }

    const cursos = (cursosRaw ?? []) as Curso[];
    const porId = new Map(cursos.map((c) => [c.id, c]));

    return filas
      .map((a) => {
        const curso = porId.get(a.curso_id);
        return curso ? { ...a, curso } : null;
      })
      .filter((a): a is DocenteCurso & { curso: Curso } => a !== null);
  }

  /* ------------------------------------------------------ Seguimiento --- */

  /** Estudiantes matriculados en los cursos del docente. */
  async listarEstudiantes(docenteId: string): Promise<Perfil[]> {
    const cursos = await this.listarMisCursos(docenteId);
    if (cursos.length === 0) {
      return [];
    }

    const { data: matriculas, error: errorMatriculas } = await this.supabase.client
      .from(this.supabase.tabla.matricula)
      .select('estudiante_id, curso_id')
      .in(
        'curso_id',
        cursos.map((c) => c.curso_id),
      )
      .in('estado', ['activa', 'completada']);

    if (errorMatriculas) {
      throw new Error(errorMatriculas.message);
    }

    const ids = [...new Set((matriculas ?? []).map((m) => m['estudiante_id'] as string))];
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('*')
      .in('id', ids)
      .eq('rol', 'estudiante');

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Perfil[];
  }

  /** Entregas de las tareas de los cursos del docente. */
  async listarEntregasPendientes(docenteId: string): Promise<
    (Entrega & { tarea: Tarea; actividad: Actividad })[]
  > {
    const cursos = await this.listarMisCursos(docenteId);
    if (cursos.length === 0) {
      return [];
    }

    const { data: actividades, error: errorActividades } = await this.supabase.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .in(
        'curso_id',
        cursos.map((c) => c.curso_id),
      )
      .eq('tipo', 'tarea');

    if (errorActividades) {
      throw new Error(errorActividades.message);
    }

    const listaActividades = (actividades ?? []) as Actividad[];
    if (listaActividades.length === 0) {
      return [];
    }

    const { data: tareasRaw, error: errorTareas } = await this.supabase.client
      .from(this.supabase.tabla.tarea)
      .select('*')
      .in(
        'actividad_id',
        listaActividades.map((a) => a.id),
      );

    if (errorTareas) {
      throw new Error(errorTareas.message);
    }

    const tareas = (tareasRaw ?? []) as Tarea[];
    if (tareas.length === 0) {
      return [];
    }

    const { data: entregasRaw, error: errorEntregas } = await this.supabase.client
      .from(this.supabase.tabla.entrega)
      .select('*')
      .in(
        'tarea_id',
        tareas.map((t) => t.id),
      )
      .in('estado', ['enviado', 'en_revision']);

    if (errorEntregas) {
      throw new Error(errorEntregas.message);
    }

    const entregas = (entregasRaw ?? []) as Entrega[];
    const visibles = await this.descartarPerfilesAdmin(entregas);

    return visibles.map((entrega) => {
      const tarea = tareas.find((t) => t.id === entrega.tarea_id)!;
      const actividad = listaActividades.find((a) => a.id === tarea.actividad_id)!;
      return { ...entrega, tarea, actividad };
    });
  }

  /** Entregas de las tareas de los cursos del docente (todos los estados). */
  async listarEntregasGestion(docenteId: string): Promise<
    (Entrega & { tarea: Tarea; actividad: Actividad })[]
  > {
    const cursos = await this.listarMisCursos(docenteId);
    if (cursos.length === 0) {
      return [];
    }

    const { data: actividades, error: errorActividades } = await this.supabase.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .in(
        'curso_id',
        cursos.map((c) => c.curso_id),
      )
      .eq('tipo', 'tarea');

    if (errorActividades) {
      throw new Error(errorActividades.message);
    }

    const listaActividades = (actividades ?? []) as Actividad[];
    if (listaActividades.length === 0) {
      return [];
    }

    const { data: tareasRaw, error: errorTareas } = await this.supabase.client
      .from(this.supabase.tabla.tarea)
      .select('*')
      .in(
        'actividad_id',
        listaActividades.map((a) => a.id),
      );

    if (errorTareas) {
      throw new Error(errorTareas.message);
    }

    const tareas = (tareasRaw ?? []) as Tarea[];
    if (tareas.length === 0) {
      return [];
    }

    const { data: entregasRaw, error: errorEntregas } = await this.supabase.client
      .from(this.supabase.tabla.entrega)
      .select('*')
      .in(
        'tarea_id',
        tareas.map((t) => t.id),
      );

    if (errorEntregas) {
      throw new Error(errorEntregas.message);
    }

    const entregas = (entregasRaw ?? []) as Entrega[];
    const visibles = await this.descartarPerfilesAdmin(entregas);

    return visibles.map((entrega) => {
      const tarea = tareas.find((t) => t.id === entrega.tarea_id)!;
      const actividad = listaActividades.find((a) => a.id === tarea.actividad_id)!;
      return { ...entrega, tarea, actividad };
    });
  }

  /** Tareas de mis cursos con su actividad y curso (para el calendario y el panel). */
  async listarTareasDeMisCursos(docenteId: string): Promise<
    (Tarea & { actividad: Actividad; curso: Curso })[]
  > {
    const cursos = await this.listarMisCursos(docenteId);
    if (cursos.length === 0) {
      return [];
    }

    const { data: actividades, error: errorActividades } = await this.supabase.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .in(
        'curso_id',
        cursos.map((c) => c.curso_id),
      )
      .eq('tipo', 'tarea');

    if (errorActividades) {
      throw new Error(errorActividades.message);
    }

    const listaActividades = (actividades ?? []) as Actividad[];
    if (listaActividades.length === 0) {
      return [];
    }

    const { data: tareasRaw, error: errorTareas } = await this.supabase.client
      .from(this.supabase.tabla.tarea)
      .select('*')
      .in(
        'actividad_id',
        listaActividades.map((a) => a.id),
      );

    if (errorTareas) {
      throw new Error(errorTareas.message);
    }

    const cursoPorId = new Map(cursos.map((c) => [c.curso_id, c.curso]));

    return ((tareasRaw ?? []) as Tarea[])
      .map((tarea) => {
        const actividad = listaActividades.find((a) => a.id === tarea.actividad_id);
        const curso = actividad ? cursoPorId.get(actividad.curso_id) : undefined;
        if (!actividad || !curso) {
          return null;
        }
        return { ...tarea, actividad, curso };
      })
      .filter((t): t is Tarea & { actividad: Actividad; curso: Curso } => t !== null);
  }

  /** Calificaciones emitidas por el docente (sin perfiles de administrador). */
  async listarCalificaciones(docenteId: string): Promise<Calificacion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.calificacion)
      .select('*')
      .eq('docente_id', docenteId)
      .order('calificado_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    const visibles = await this.descartarPerfilesAdmin((data ?? []) as Calificacion[]);
    return visibles as Calificacion[];
  }
}
