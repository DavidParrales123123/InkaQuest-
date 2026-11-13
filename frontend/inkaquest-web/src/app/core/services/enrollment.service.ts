// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

/**
 * Servicio de matrículas y progreso del estudiante.
 *
 * <p>Las lecturas van por Supabase/RLS (fila propia visible para el
 * estudiante); la inscripción/cancelación escriben por la API REST de
 * Spring Boot. La respuesta de {@code GET /matriculas/yo} anida el curso
 * mínimo; aquí lo normalizamos a una forma plana para la UI:
 * {@code { ...m, curso, cursoId, cursoTitulo, curso_id }}.</p>
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/matriculas`;

  // === MIS MATRÍCULAS ===

  /**
   * Matrículas del estudiante autenticado (normalizadas, vía Supabase+RLS).
   *
   * <p>Se acota EXPLÍCITAMENTE a las filas del usuario actual: aunque la RLS
   * permite a un docente/admin ver matrículas de otros, las vistas de
   * estudiante muestran siempre las propias.</p>
   */
  async listarMisMatriculas(): Promise<MatriculaResponse[]> {
    const uid = this.auth.usuario()?.id;
    let consulta = this.client
      .from(this.supabase.tabla.matricula)
      .select('*, curso:curso_id(*)')
      .order('matriculado_en', { ascending: false, nullsFirst: true });

    // Si por cualquier motivo el usuario no tiene sesión, la consulta devuelve 0 filas.
    consulta = consulta.eq('estudiante_id', uid ?? '00000000-0000-0000-0000-000000000000');

    const { data, error } = await consulta;

    if (error) {
      console.error('[InkaQuest] Error cargando matrículas:', error.message);
      throw new Error('No se pudieron cargar tus matrículas.');
    }

    return (data ?? []).map((m: any) => this.normalizarMatricula(m));
  }

  /** Normaliza la fila del backend a la forma usada por la UI. */
  private normalizarMatricula(m: any): MatriculaResponse {
    const curso = m?.curso ?? null;
    const id = curso?.id ?? m?.cursoId ?? m?.curso_id ?? null;
    return {
      id: m?.id,
      curso,
      cursoId: id,
      curso_id: id,
      cursoTitulo: curso?.titulo ?? 'Curso',
      estado: m?.estado,
      precioPagado: m?.precioPagado ?? m?.precio_pagado ?? 0,
      moneda: m?.moneda ?? curso?.moneda ?? 'PEN',
      porcentajeProgreso: m?.porcentajeProgreso ?? 0,
      xpGanado: m?.xpGanado ?? 0,
      matriculadoEn: m?.matriculadoEn ?? null,
      completadoEn: m?.completadoEn ?? null,
      creadoEn: m?.creadoEn ?? null,
      // Compatibilidad con plantillas que usan snake_case:
      precio_pagado: m?.precioPagado ?? m?.precio_pagado ?? 0,
      matriculado_en: m?.matriculadoEn ?? null,
    };
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

  /** Inscribe al usuario autenticado en un curso publicado (por su slug). */
  async matricularme(cursoSlug: string): Promise<MatriculaResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<any>>(
        `${this.baseUrl}/matricularme`,
        { cursoSlug },
      ),
    );
    return this.normalizarMatricula(res.data);
  }

  /** Cancelación de la matrícula del usuario. */
  async cancelarMatricula(matriculaId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${matriculaId}`),
    );
  }

  // === INSCRIPCIÓN DESDE EL CATÁLOGO ===

  /** Inscripción gratuita: matricula directa vía API. */
  async inscribirCursoGratis(curso: { slug?: string } | null): Promise<{ ok: boolean; mensaje: string }> {
    if (!curso?.slug) {
      return { ok: false, mensaje: 'No pudimos identificar el curso.' };
    }
    try {
      await this.matricularme(curso.slug);
      return { ok: true, mensaje: '¡Listo! Ya estás matriculado. Nos vemos en el aula.' };
    } catch (error: any) {
      return { ok: false, mensaje: this.mensajeDeError(error, 'No pudimos completar la inscripción.') };
    }
  }

  /**
   * Inscripción de curso de pago: crea un pedido (la activación de la
   * matrícula corresponde al flujo de pagos/Culqi en el backend).
   */
  async solicitarMatricula(curso: { slug?: string } | null): Promise<{ ok: boolean; mensaje: string }> {
    if (!curso?.slug) {
      return { ok: false, mensaje: 'No pudimos identificar el curso.' };
    }
    try {
      await firstValueFrom(
        this.http.post<ApiResponse<any>>(
          `${environment.apiUrl}/pedidos/iniciar`,
          {
            cursoSlug: curso.slug,
            claveIdempotencia: this.claveIdempotencia(),
          },
        ),
      );
      return { ok: true, mensaje: 'Solicitud de compra registrada. Te llevamos a la sección de pagos para completarla.' };
    } catch (error: any) {
      return { ok: false, mensaje: this.mensajeDeError(error, 'No pudimos registrar tu solicitud.') };
    }
  }

  private claveIdempotencia(): string {
    try {
      return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    } catch {
      return `${Date.now()}-${Math.random()}`;
    }
  }

  private mensajeDeError(error: any, respaldo: string): string {
    const msg = error?.error?.message || error?.message;
    if (typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length < 200) {
      return msg;
    }
    return respaldo;
  }
}

// === INTERFACES ===

export interface MatriculaResponse {
  id: string;
  curso: any | null;
  cursoId: string | null;
  curso_id: string | null;
  cursoTitulo: string;
  estado: string;
  precioPagado: number;
  precio_pagado: number;
  moneda: string;
  porcentajeProgreso: number;
  xpGanado: number;
  matriculadoEn: string | null;
  matriculado_en: string | null;
  completadoEn: string | null;
  creadoEn: string | null;
}
