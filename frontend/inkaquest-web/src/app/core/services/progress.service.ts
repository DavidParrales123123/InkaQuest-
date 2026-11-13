// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio de progreso académico.
 *
 * Consume el backend REST API para:
 * - Consultar progreso en cursos
 * - Registrar lecciones completadas
 * - Obtener estadísticas de avance
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/progreso`;

  // === MI PROGRESO ===

  /** Obtiene el progreso del usuario en todos sus cursos. */
  async listarMiProgreso(): Promise<ProgresoCursoResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<ProgresoCursoResponse[]>>(`${this.baseUrl}/yo`)
    );
    return res.data || [];
  }

  /** Obtiene el progreso de un curso específico. */
  async obtenerProgresoCurso(cursoId: string): Promise<ProgresoCursoResponse | null> {
    const progresos = await this.listarMiProgreso();
    return progresos.find(p => p.cursoId === cursoId) || null;
  }

  // === COMPLETAR LECCIONES ===

  /** Marca una lección como completada. */
  async completarLeccion(leccionId: string): Promise<LeccionCompletadaResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<LeccionCompletadaResponse>>(
        `${this.baseUrl}/lecciones/${leccionId}/completar`,
        {}
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface ProgresoCursoResponse {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  estudianteId: string;
  porcentajeCompletado: number;
  leccionesCompletadas: number;
  leccionesTotales: number;
  xpObtenido: number;
  ultimaActividadEn: string;
  creadoEn: string;
}

export interface LeccionCompletadaResponse {
  leccionId: string;
  cursoId: string;
  porcentajeCompletado: number;
  xpObtenido: number;
  xpTotal: number;
  leccionesCompletadas: number;
  leccionesTotales: number;
}
