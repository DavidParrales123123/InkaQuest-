// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

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
  private readonly baseUrl = `${environment.apiUrl}/certificados`;

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
