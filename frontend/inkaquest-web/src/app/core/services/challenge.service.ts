// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio de retos y desafíos.
 *
 * Consume el backend REST API para:
 * - Listar retos activos
 * - Participar en retos
 * - Enviar soluciones
 * - Ver ranking de retos
 */
@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/retos`;

  // === RETOS ===

  /** Lista retos activos. */
  async listarActivos(): Promise<RetoResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<RetoResponse[]>>(`${this.baseUrl}/activos`)
    );
    return res.data || [];
  }

  /** Obtiene el detalle de un reto. */
  async obtenerReto(id: string): Promise<RetoDetalleResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<RetoDetalleResponse>>(`${this.baseUrl}/${id}`)
    );
    return res.data!;
  }

  // === PARTICIPACIÓN ===

  /** Inicia la participación en un reto. */
  async participar(retoId: string): Promise<ParticipacionResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<ParticipacionResponse>>(
        `${this.baseUrl}/${retoId}/participar`,
        {}
      )
    );
    return res.data!;
  }

  /** Envía una solución al reto. */
  async enviarSolucion(retoId: string, datos: {
    solucion: string;
    archivos?: File[];
  }): Promise<SolucionResponse> {
    const formData = new FormData();
    formData.append('solucion', datos.solucion);
    
    if (datos.archivos) {
      datos.archivos.forEach(archivo => formData.append('archivos', archivo));
    }

    const res = await firstValueFrom(
      this.http.post<ApiResponse<SolucionResponse>>(
        `${this.baseUrl}/${retoId}/soluciones`,
        formData
      )
    );
    return res.data!;
  }

  // === MIS PARTICIPACIONES ===

  /** Obtiene las participaciones del usuario en retos. */
  async misParticipaciones(): Promise<ParticipacionResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<ParticipacionResponse[]>>(`${this.baseUrl}/mis-participaciones`)
    );
    return res.data || [];
  }

  // === RANKING ===

  /** Obtiene el ranking de un reto. */
  async obtenerRanking(retoId: string): Promise<RankingRetoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<RankingRetoResponse>>(`${this.baseUrl}/${retoId}/ranking`)
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface RetoResponse {
  id: string;
  titulo: string;
  descripcion: string;
  dificultad: string;
  puntos: number;
  xpRecompensa: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  participantes: number;
  soluciones: number;
}

export interface RetoDetalleResponse {
  id: string;
  titulo: string;
  descripcion: string;
  instrucciones: string | null;
  dificultad: string;
  puntos: number;
  xpRecompensa: number;
  tiempoLimiteHoras: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  participantes: number;
  yaParticipo: boolean;
  miSolucion: SolucionResponse | null;
}

export interface ParticipacionResponse {
  id: string;
  retoId: string;
  usuarioId: string;
  fechaInicio: string;
  estado: string;
  puntaje: number | null;
}

export interface SolucionResponse {
  id: string;
  retoId: string;
  usuarioId: string;
  contenido: string;
  puntaje: number | null;
  estado: string;
  enviadoEn: string;
  revisadoEn: string | null;
  comentarioRevisor: string | null;
}

export interface RankingRetoResponse {
  retoId: string;
  retoTitulo: string;
  participantes: RankingEntradaRetoResponse[];
  miPosicion: number | null;
}

export interface RankingEntradaRetoResponse {
  posicion: number;
  usuarioId: string;
  usuarioNombre: string;
  puntaje: number;
  tiempoCompletado: string | null;
}
