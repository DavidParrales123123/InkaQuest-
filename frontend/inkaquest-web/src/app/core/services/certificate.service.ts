// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';
import { Certificado } from '../models/domain.models';

/**
 * Servicio de certificados digitales.
 *
 * Consume el backend REST API para:
 * - Generar certificados al completar cursos
 * - Listar certificados obtenidos
 * - Verificar autenticidad de certificados
 * - Descargar PDF de certificados
 */
@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly baseUrl = `${environment.apiUrl}/certificados`;

  // === VERIFICACIÓN PÚBLICA Y LISTADO PROPIO (Supabase + RLS) ===

  /** Lista los certificados emitidos al estudiante. */
  async listarCertificados(usuarioId: string): Promise<Certificado[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.certificadoTitular)
      .select('certificado:certificado_id(*)')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('[InkaQuest] Error cargando certificados:', error.message);
      throw new Error('No se pudieron cargar tus certificados.');
    }

    return ((data ?? []) as any[])
      .map((row) => row?.certificado)
      .filter(Boolean) as Certificado[];
  }

  /** Verificación pública por código (el código basta, no exige sesión). */
  async verificarPorCodigo(codigo: string): Promise<Certificado | null> {
    const limpio = (codigo || '').trim();
    if (!limpio) return null;

    const { data, error } = await this.client
      .from(this.supabase.tabla.certificado)
      .select('*')
      .ilike('codigo', limpio)
      .eq('estado', 'emitido')
      .maybeSingle();

    if (error) {
      console.error('[InkaQuest] Error verificando el certificado:', error.message);
      return null;
    }
    return (data as Certificado) ?? null;
  }

  /** Devuelve el curso asociado al certificado para la verificación pública. */
  async obtenerCursoCertificado(certificadoId: string): Promise<{ id: string; titulo: string; slug: string } | null> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.certificadoCurso)
      .select('curso:curso_id(id, titulo, slug)')
      .eq('certificado_id', certificadoId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return (data as any).curso ?? null;
  }

  // === MIS CERTIFICADOS ===

  /** Obtiene los certificados del usuario autenticado. */
  async listarMisCertificados(): Promise<CertificadoResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CertificadoResponse[]>>(`${this.baseUrl}/yo`)
    );
    return res.data || [];
  }

  /** Obtiene un certificado por su código único. */
  async obtenerPorCodigo(codigo: string): Promise<CertificadoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CertificadoResponse>>(`${this.baseUrl}/codigo/${codigo}`)
    );
    return res.data!;
  }

  // === GENERACIÓN ===

  /** Solicita la generación de un certificado para un curso completado. */
  async generarCertificado(cursoId: string): Promise<CertificadoResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<CertificadoResponse>>(
        `${this.baseUrl}/generar`,
        { cursoId }
      )
    );
    return res.data!;
  }

  // === VERIFICACIÓN ===

  /** Verifica la autenticidad de un certificado por su código. */
  async verificar(codigo: string): Promise<VerificacionCertificadoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<VerificacionCertificadoResponse>>(
        `${this.baseUrl}/verificar/${codigo}`
      )
    );
    return res.data!;
  }

  // === DESCARGA ===

  /** Obtiene la URL para descargar el PDF de un certificado. */
  getUrlDescarga(codigo: string): string {
    return `${this.baseUrl}/${codigo}/pdf`;
  }
}

// === INTERFACES ===

export interface CertificadoResponse {
  id: string;
  codigo: string;
  usuarioId: string;
  usuarioNombre: string;
  cursoId: string;
  cursoTitulo: string;
  fechaEmision: string;
  urlPdf: string | null;
  urlVerificacion: string;
  verificado: boolean;
}

export interface VerificacionCertificadoResponse {
  valido: boolean;
  codigo: string;
  usuarioNombre: string | null;
  cursoTitulo: string | null;
  fechaEmision: string | null;
  mensaje: string;
}
