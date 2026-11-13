// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio de matrículas y progreso del estudiante.
 *
 * Consume el backend REST API para:
 * - Listar matrículas del usuario
 * - Matricularse en cursos
 * - Cancelar matrículas
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matriculas`;

  // === MIS MATRÍCULAS ===

  /** Obtiene las matrículas del usuario autenticado. */
  async listarMisMatriculas(): Promise<MatriculaResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<MatriculaResponse[]>>(`${this.baseUrl}/yo`)
    );
    return res.data || [];
  }

  /** Verifica si el usuario está matriculado en un curso. */
  async estaMatriculado(cursoId: string): Promise<boolean> {
    const matriculas = await this.listarMisMatriculas();
    return matriculas.some(
      m => m.cursoId === cursoId && 
      (m.estado === 'activa' || m.estado === 'completada' || m.estado === 'pendiente_pago')
    );
  }

  /** Obtiene la matrícula del usuario para un curso específico. */
  async obtenerMatriculaDeCurso(cursoId: string): Promise<MatriculaResponse | null> {
    const matriculas = await this.listarMisMatriculas();
    return matriculas.find(
      m => m.cursoId === cursoId &&
      (m.estado === 'activa' || m.estado === 'completada' || m.estado === 'pendiente_pago')
    ) || null;
  }

  // === MATRICULACIÓN ===

  /** Matricula al usuario en un curso. */
  async matricularme(cursoId: string): Promise<MatriculaResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<MatriculaResponse>>(
        `${this.baseUrl}/matricularme`,
        { cursoId }
      )
    );
    return res.data!;
  }

  /** Cancela una matrícula. */
  async cancelarMatricula(matriculaId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${matriculaId}`)
    );
  }
}

// === INTERFACES ===

export interface MatriculaResponse {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  estudianteId: string;
  estado: string;
  precioPagado: number;
  moneda: string;
  creadoEn: string;
  activadaEn: string | null;
  canceladoEn: string | null;
  completadaEn: string | null;
}
