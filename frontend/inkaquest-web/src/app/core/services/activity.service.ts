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
          .insert({ tarea_id: tareaId, contenido, estado: 'enviado', enviada_en: new Date().toISOString() })
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

  /** Lista las entregas de una tarea (vista docente). */
  async listarEntregas(tareaId: string, estado?: string): Promise<EntregaResponse[]> {
    const params = estado ? { estado } : {};
    const res = await firstValueFrom(
      this.http.get<ApiResponse<EntregaResponse[]>>(`${this.tareasUrl}/${tareaId}/entregas`, { params })
    );
    return res.data || [];
  }

  /** Califica una entrega (solo docente del curso). */
  async calificarEntrega(entregaId: string, nota: number, comentario?: string): Promise<EntregaResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<EntregaResponse>>(
        `${environment.apiUrl}/entregas/${entregaId}/calificar`,
        { nota, comentario }
      )
    );
    return res.data!;
  }
}
