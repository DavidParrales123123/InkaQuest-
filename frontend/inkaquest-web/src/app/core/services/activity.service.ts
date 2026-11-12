import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

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
  private readonly tareasUrl = `${environment.apiUrl}/tareas`;

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
