// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import {
  Actividad,
  Entrega,
  Tarea,
  TareaArchivo,
  EntregaArchivo,
  Calificacion,
} from '../models/domain.models';

// === INTERFACES ===

export interface ActividadResponse {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  xpOtorgado: number;
  tiempoLimiteMinutos: number | null;
  publicado: boolean;
  creadoEn: string;
}

export interface TareaResponse {
  id: string;
  actividadId: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string | null;
  permiteEntregaTardia: boolean;
  notaMaxima: number;
  tieneEntrega: boolean;
  estadoEntrega: string | null;
}

export interface TareaDetalleResponse {
  id: string;
  actividadId: string;
  titulo: string;
  descripcion: string;
  instrucciones: string | null;
  fechaApertura: string | null;
  fechaEntrega: string | null;
  permiteEntregaTardia: boolean;
  penalizacionTardia: number;
  notaMaxima: number;
  archivos: ArchivoResponse[];
  miEntrega: EntregaDetalleResponse | null;
}

export interface EntregaResponse {
  id: string;
  tareaId: string;
  estudianteId: string;
  estadoEntrega: string;
  contenido: string | null;
  nota: number | null;
  enviadaEn: string | null;
  revisadaEn: string | null;
}

export interface EntregaDetalleResponse {
  id: string | null;
  tareaId: string;
  estadoEntrega: string;
  contenido: string | null;
  archivos: ArchivoResponse[];
  nota: number | null;
  comentarioDocente: string | null;
  enviadaEn: string | null;
  revisadaEn: string | null;
}

export interface ArchivoResponse {
  id: string;
  nombre: string;
  url: string;
  mimeType: string;
  tamanioBytes: number;
  creadoEn: string;
}

/**
 * Servicio de gestión de actividades y tareas.
 *
 * Consume el backend REST API para:
 * - Listado y detalle de tareas
 * - Entregas de tareas (estudiantes)
 * - Calificaciones (docentes)
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly tareasUrl = `${environment.apiUrl}/tareas`;

  // === DATOS DEL ESTUDIANTE (Supabase + RLS) ===

  /**
   * Lista las tareas publicadas de un curso, con la actividad embebida y
   * la entrega del estudiante (la RLS restringe las filas al propio usuario).
   */
  async listarTareasCurso(cursoId: string, _estudianteId?: string): Promise<(Tarea & { actividad: Actividad; entrega: Entrega | null })[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.tarea)
      .select('*, actividad:actividad_id!inner(*), entrega:entrega(id, estado, contenido, nota, enviada_en, revisada_en)')
      .eq('actividad.curso_id', cursoId)
      .eq('actividad.publicado', true)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando tareas del curso:', error.message);
      return [];
    }

    return (data ?? []).map((fila: any) => ({
      ...fila,
      entrega: Array.isArray(fila.entrega) ? (fila.entrega[0] ?? null) : (fila.entrega ?? null),
    })) as (Tarea & { actividad: Actividad; entrega: Entrega | null })[];
  }

  /** Calificaciones propias del estudiante. */
  async listarCalificaciones(estudianteId?: string): Promise<Calificacion[]> {
    let consulta = this.client
      .from(this.supabase.tabla.calificacion)
      .select('*')
      .order('calificado_en', { ascending: false });

    if (estudianteId) consulta = consulta.eq('estudiante_id', estudianteId);

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando calificaciones:', error.message);
      return [];
    }
    return (data ?? []) as Calificacion[];
  }

  /** Adjuntos de una tarea (material del docente). */
  async listarAdjuntosTarea(tareaId: string): Promise<TareaArchivo[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.tareaArchivo)
      .select('*')
      .eq('tarea_id', tareaId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando adjuntos de la tarea:', error.message);
      return [];
    }
    return (data ?? []) as TareaArchivo[];
  }

  /** Archivos del estudiante en una entrega. */
  async listarEntregaArchivos(entregaId: string): Promise<EntregaArchivo[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.entregaArchivo)
      .select('*')
      .eq('entrega_id', entregaId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando archivos de tu entrega:', error.message);
      return [];
    }
    return (data ?? []) as EntregaArchivo[];
  }

  /** Entrega del estudiante para una tarea (si existe). */
  async obtenerEntregaDeEstudiante(tareaId: string, _estudianteId?: string): Promise<Entrega | null> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.entrega)
      .select('*')
      .eq('tarea_id', tareaId)
      .maybeSingle();

    if (error) {
      console.error('[InkaQuest] Error consultando entrega:', error.message);
      return null;
    }
    return (data as Entrega) ?? null;
  }

  /** Crea o actualiza la entrega del estudiante. */
  async enviarTarea(tareaId: string, _estudianteId: string, contenido: string): Promise<{ ok: boolean; mensaje: string }> {
    const existente = await this.obtenerEntregaDeEstudiante(tareaId);

    const { data, error } = existente
      ? await this.client
          .from(this.supabase.tabla.entrega)
          .update({ contenido, estado: existente.estado === 'borrador' ? 'borrador' : 'enviado', enviada_en: new Date().toISOString() })
          .eq('id', existente.id)
          .select()
          .maybeSingle()
      : await this.client
          .from(this.supabase.tabla.entrega)
          .insert({ tarea_id: tareaId, estudiante_id: _estudianteId, contenido, estado: 'enviado', enviada_en: new Date().toISOString() })
          .select()
          .maybeSingle();

    if (error) {
      console.error('[InkaQuest] Error enviando la entrega:', error.message);
      return { ok: false, mensaje: 'No pudimos registrar tu respuesta. Intenta de nuevo.' };
    }
    return { ok: true, mensaje: 'Respuesta enviada.' };
  }

  /** Sube un archivo a la entrega del estudiante (bucket privado 'entregas'). */
  async subirEntregaArchivo(entregaId: string, estudianteId: string, archivo: File): Promise<{ ruta: string; nombre: string }> {
    const limpio = archivo.name.replace(/[^\w.\-() ]+/g, '_');
    const ruta = `${estudianteId}/${Date.now()}-${crypto.randomUUID()}-${limpio}`;

    const { error: errorStorage } = await this.supabase.client.storage
      .from('entregas')
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: false,
        contentType: archivo.type || undefined,
      });

    if (errorStorage) {
      throw new Error(errorStorage.message || 'No se pudo subir el archivo.');
    }

    const { error: errorInsert } = await this.client
      .from(this.supabase.tabla.entregaArchivo)
      .insert({
        entrega_id: entregaId,
        nombre: archivo.name,
        ruta_storage: ruta,
        mime_type: archivo.type || null,
        tamano_bytes: archivo.size ?? null,
      });

    if (errorInsert) {
      // Rollback del objeto subido si la fila falló.
      await this.client.storage.from('entregas').remove([ruta]).catch(() => undefined);
      throw new Error(errorInsert.message || 'No se pudo registrar el archivo.');
    }

    return { ruta, nombre: archivo.name };
  }

  /** Elimina un archivo de la entrega del estudiante. */
  async eliminarEntregaArchivo(id: string, rutaStorage: string): Promise<void> {
    const { error: errorStorage } = await this.supabase.client.storage.from('entregas').remove([rutaStorage]);
    if (errorStorage) {
      throw new Error(errorStorage.message || 'No se pudo borrar el archivo del almacenamiento.');
    }
    const { error: errorDelete } = await this.client.from(this.supabase.tabla.entregaArchivo).delete().eq('id', id);
    if (errorDelete) {
      throw new Error(errorDelete.message || 'No se pudo borrar el registro del archivo.');
    }
  }

  /** URL firmada temporal para descargar un adjunto de tarea del docente. */
  async descargarUrlAdjuntoTarea(rutaStorage: string): Promise<string | null> {
    const { data, error } = await this.client.storage.from('recursos').createSignedUrl(rutaStorage, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  /** URL firmada temporal para descargar un archivo propio de la entrega. */
  async descargarUrlEntregaArchivo(rutaStorage: string): Promise<string | null> {
    const { data, error } = await this.client.storage.from('entregas').createSignedUrl(rutaStorage, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  // === TAREAS ===

  /** Lista todas las tareas (con filtros opcionales). */
  async listarTareas(cursoId?: string, estado?: string): Promise<TareaResponse[]> {
    const params: any = {};
    if (cursoId) params.cursoId = cursoId;
    if (estado) params.estado = estado;

    const res = await firstValueFrom(
      this.http.get<ApiResponse<TareaResponse[]>>(this.tareasUrl, { params })
    );
    return res.data || [];
  }

  /** Obtiene el detalle completo de una tarea. */
  async obtenerTarea(id: string): Promise<TareaDetalleResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TareaDetalleResponse>>(`${this.tareasUrl}/${id}`)
    );
    return res.data!;
  }

  /** Obtiene la entrega del estudiante autenticado para una tarea. */
  async obtenerMiEntrega(tareaId: string): Promise<EntregaDetalleResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<EntregaDetalleResponse>>(`${this.tareasUrl}/${tareaId}/mi-entrega`)
    );
    return res.data!;
  }

  /** Entrega o actualiza la tarea con contenido y archivos opcionales. */
  async entregarTarea(tareaId: string, contenido: string, archivos?: File[]): Promise<EntregaResponse> {
    const formData = new FormData();
    formData.append('contenido', contenido);

    if (archivos && archivos.length > 0) {
      archivos.forEach(archivo => formData.append('archivos', archivo));
    }

    const res = await firstValueFrom(
      this.http.post<ApiResponse<EntregaResponse>>(`${this.tareasUrl}/${tareaId}/entregar`, formData)
    );
    return res.data!;
  }

  // === DOCENTE: GESTIÓN DE TAREAS ===

  // (Las rutas detrás de este bloque pasan por Supabase+RLS:
  //  `pol_actividad_write`, `pol_tarea_all`, `pol_tarea_archivo_*`,
  //  `pol_entrega_*` y `pol_calificacion_*` validan que el autor sea
  //  el docente del curso o un admin. Los intentos ajenos se rechazan
  //  en la base.)

  /** Crea la actividad asociada a una lección (tarea/reto/quiz). Devuelve la fila creada. */
  async crearActividad(datos: {
    leccion_id: string;
    curso_id: string;
    tipo: string;
    titulo: string;
    descripcion?: string | null;
    instrucciones?: string | null;
    publicado?: boolean;
    creado_por?: string | null;
    puntos?: number;
    xp_otorgado?: number;
    tiempo_limite_minutos?: number | null;
    intentos_permitidos?: number;
  }): Promise<Actividad> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.actividad)
      .insert({
        leccion_id: datos.leccion_id,
        curso_id: datos.curso_id,
        tipo: datos.tipo ?? 'tarea',
        titulo: datos.titulo,
        descripcion: datos.descripcion ?? null,
        instrucciones: datos.instrucciones ?? null,
        publicado: datos.publicado ?? false,
        creado_por: datos.creado_por ?? null,
        puntos: datos.puntos ?? 0,
        xp_otorgado: datos.xp_otorgado ?? 0,
        tiempo_limite_minutos: datos.tiempo_limite_minutos ?? null,
        intentos_permitidos: Math.max(1, datos.intentos_permitidos ?? 1),
      })
      .select()
      .single();

    if (error) {
      console.error('[InkaQuest] Error creando la actividad:', error.message);
      throw new Error(error.message);
    }
    return (data ?? null) as Actividad;
  }

  /** Actualiza parcialmente una actividad (p. ej. toggle publicado). */
  async actualizarActividad(id: string, cambios: { publicado?: boolean; titulo?: string; descripcion?: string | null; instrucciones?: string | null; xp_otorgado?: number; puntos?: number; tiempo_limite_minutos?: number | null }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.actividad).update(cambios).eq('id', id);
    if (error) {
      console.error('[InkaQuest] Error actualizando la actividad:', error.message);
      throw new Error(error.message);
    }
  }

  /** Elimina una actividad (cascada a tarea/evaluación/entregas/calificaciones derivadas). */
  async eliminarActividad(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.actividad).delete().eq('id', id);
    if (error) {
      console.error('[InkaQuest] Error eliminando la actividad:', error.message);
      throw new Error(error.message);
    }
  }

  /** Crea o actualiza (upsert por actividad_id) la fila de la tarea. */
  async guardarTarea(actividadId: string, datos: {
    fecha_entrega?: string | null;
    fecha_apertura?: string | null;
    permite_entrega_tardia?: boolean;
    penalizacion_tardia?: number;
    nota_maxima?: number;
  }): Promise<void> {
    const { error } = await this.client
      .from(this.supabase.tabla.tarea)
      .upsert(
        {
          actividad_id: actividadId,
          fecha_entrega: datos.fecha_entrega ?? null,
          fecha_apertura: datos.fecha_apertura ?? null,
          permite_entrega_tardia: datos.permite_entrega_tardia ?? false,
          penalizacion_tardia: datos.penalizacion_tardia ?? 0,
          nota_maxima: datos.nota_maxima ?? 20,
        },
        { onConflict: 'actividad_id' },
      );

    if (error) {
      console.error('[InkaQuest] Error guardando la tarea:', error.message);
      throw new Error(error.message);
    }
  }

  /** Lista las tareas (todas, incl. borradores) de un curso para el docente. */
  async listarTareasGestion(cursoId: string): Promise<(Tarea & { actividad: Actividad })[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.tarea)
      .select('*, actividad:actividad_id!inner(*)')
      .eq('actividad.curso_id', cursoId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error listando tareas de gestión:', error.message);
      throw new Error(error.message);
    }
    return (data ?? []) as (Tarea & { actividad: Actividad })[];
  }

  /** Sube un adjunto del docente asociado a una tarea (bucket privado 'recursos'). */
  async subirAdjuntoTarea(tareaId: string, cursoId: string, archivo: File): Promise<TareaArchivo> {
    const limpio = archivo.name.replace(/[^\w.\-() ]+/g, '_');
    const ruta = `${cursoId}/tareas/${tareaId}/${Date.now()}-${crypto.randomUUID()}-${limpio}`;

    const { error: storageError } = await this.client.storage
      .from('recursos')
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: false,
        contentType: archivo.type || undefined,
      });

    if (storageError) {
      throw new Error(storageError.message || 'No se pudo subir el archivo.');
    }

    const { data, error } = await this.client
      .from(this.supabase.tabla.tareaArchivo)
      .insert({
        tarea_id: tareaId,
        nombre: archivo.name,
        ruta_storage: ruta,
        mime_type: archivo.type || null,
        tamano_bytes: archivo.size ?? null,
      })
      .select()
      .single();

    if (error) {
      // Rollback best effort: borra el objeto si falló la fila.
      await this.client.storage.from('recursos').remove([ruta]).catch(() => undefined);
      throw new Error(error.message || 'No se pudo registrar el adjunto.');
    }
    return (data ?? null) as TareaArchivo;
  }

  /** Elimina un adjunto del docente (fila + objeto en storage). */
  async eliminarAdjuntoTarea(id: string, rutaStorage: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.tareaArchivo).delete().eq('id', id);
    if (error) {
      throw new Error(error.message || 'No se pudo borrar el adjunto.');
    }
    await this.client.storage.from('recursos').remove([rutaStorage]).catch(() => undefined);
  }

  /** Batch: archivos de varias entregas (p. ej. la bandeja de calificación). */
  async listarEntregaArchivosDeVarias(entregaIds: string[]): Promise<EntregaArchivo[]> {
    if (!Array.isArray(entregaIds) || entregaIds.length === 0) return [];
    const { data, error } = await this.client
      .from(this.supabase.tabla.entregaArchivo)
      .select('*')
      .in('entrega_id', entregaIds)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error listando archivos de entregas:', error.message);
      throw new Error(error.message);
    }
    return (data ?? []) as EntregaArchivo[];
  }

  /** Lista las entregas de una tarea (vista docente). */
  async listarEntregas(tareaId: string, estado?: string): Promise<EntregaResponse[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.entrega)
      .select('*')
      .eq('tarea_id', tareaId);

    if (error) {
      console.error('[InkaQuest] Error listando entregas:', error.message);
      return [];
    }
    const rows = (data ?? []) as Entrega[];
    if (!estado) return rows.map(r => ({ ...r, estadoEntrega: r.estado })) as unknown as EntregaResponse[];
    return rows.filter((r) => (r as any).estado === estado).map((r) => ({ ...r, estadoEntrega: (r as any).estado })) as unknown as EntregaResponse[];
  }

  /** Califica una entrega: marca la entrega como revisada y registra la calificación (docente del curso). */
  async calificarEntrega(entregaId: string, nota: number, comentario?: string, notaMaxima?: number): Promise<{ ok: boolean; mensaje: string }> {
    const { data: { user } } = await this.client.auth.getUser();

    const { data: entrega, error: entregaError } = await this.client
      .from(this.supabase.tabla.entrega)
      .select('id, estudiante_id, tarea_id')
      .eq('id', entregaId)
      .maybeSingle();

    if (entregaError) return { ok: false, mensaje: entregaError.message };
    if (!entrega) return { ok: false, mensaje: 'No se encontró la entrega.' };

    const notaNum = Number.isFinite(nota) ? Number(nota) : 0;
    const max = notaMaxima && notaMaxima > 0 ? notaMaxima : 20;
    const notaClamped = Math.max(0, Math.min(notaNum, max));
    const notaMaximaFinal = max;
    const ahora = new Date().toISOString();

    const { error: updateError } = await this.client
      .from(this.supabase.tabla.entrega)
      .update({ nota: notaClamped, estado: 'revisada', revisada_en: ahora })
      .eq('id', entregaId);

    if (updateError) {
      console.error('[InkaQuest] Error calificando la entrega:', updateError.message);
      return { ok: false, mensaje: updateError.message };
    }

    const payload = {
      entrega_id: entregaId,
      estudiante_id: entrega.estudiante_id,
      docente_id: user?.id ?? null,
      nota: notaClamped,
      nota_maxima: notaMaximaFinal,
      aprobado: null,
      comentario: (comentario ?? '').trim() || null,
      calificado_en: ahora,
    };

    const { data: existente, error: consultaError } = await this.client
      .from(this.supabase.tabla.calificacion)
      .select('id')
      .eq('entrega_id', entregaId)
      .maybeSingle();

    if (consultaError) {
      console.error('[InkaQuest] Error en la calificación previa:', consultaError.message);
      return { ok: false, mensaje: consultaError.message };
    }

    const escritura = existente
      ? await this.client.from(this.supabase.tabla.calificacion).update(payload).eq('id', existente.id)
      : await this.client.from(this.supabase.tabla.calificacion).insert(payload);

    if (escritura.error) {
      console.error('[InkaQuest] Error guardando la calificación:', escritura.error.message);
      return { ok: false, mensaje: escritura.error.message };
    }
    return { ok: true, mensaje: 'Calificación registrada.' };
  }
}
