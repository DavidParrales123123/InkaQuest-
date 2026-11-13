// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio de soporte y tickets.
 *
 * Consume el backend REST API para:
 * - Crear y gestionar tickets de soporte
 * - Ver historial de tickets
 * - Responder a tickets
 */
@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/soporte`;

  // === TICKETS ===

  /** Obtiene los tickets del usuario autenticado. */
  async listarMisTickets(): Promise<TicketResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TicketResponse[]>>(`${this.baseUrl}/tickets/yo`)
    );
    return res.data || [];
  }

  /** Obtiene el detalle de un ticket. */
  async obtenerTicket(id: string): Promise<TicketResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TicketResponse>>(`${this.baseUrl}/tickets/${id}`)
    );
    return res.data!;
  }

  /** Crea un nuevo ticket de soporte. */
  async crearTicket(datos: {
    asunto: string;
    descripcion: string;
    categoria: string;
    prioridad: string;
  }): Promise<TicketResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<TicketResponse>>(`${this.baseUrl}/tickets`, datos)
    );
    return res.data!;
  }

  /** Responde a un ticket. */
  async responder(ticketId: string, mensaje: string): Promise<RespuestaResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<RespuestaResponse>>(
        `${this.baseUrl}/tickets/${ticketId}/mensajes`,
        { mensaje }
      )
    );
    return res.data!;
  }

  /** Cierra un ticket. */
  async cerrarTicket(ticketId: string): Promise<TicketResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<TicketResponse>>(
        `${this.baseUrl}/tickets/${ticketId}/cerrar`,
        {}
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface TicketResponse {
  id: string;
  usuarioId: string;
  asunto: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  asignadoA: string | null;
  creadoEn: string;
  actualizadoEn: string;
  cerradoEn: string | null;
  resueltoEn: string | null;
  mensajes: MensajeTicketResponse[];
}

export interface MensajeTicketResponse {
  id: string;
  ticketId: string;
  autorId: string;
  autorNombre: string;
  cuerpo: string;
  esInterna: boolean;
  creadoEn: string;
}

export interface RespuestaResponse {
  id: string;
  ticketId: string;
  autorId: string;
  cuerpo: string;
  creadoEn: string;
}
