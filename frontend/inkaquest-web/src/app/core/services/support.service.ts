// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Ticket } from '../models/domain.models';

/** Entrada para crear un ticket de soporte. */
export interface CrearTicketInput {
  asunto: string;
  descripcion: string;
  categoria?: string;
  prioridad?: 'baja' | 'media' | 'alta' | string;
}

/** Resultado normalizado de la creación/acciones de ticket. */
export interface CrearTicketResultado {
  ok: boolean;
  mensaje: string;
  ticketId?: string;
}

/** DTO `TicketResponse` que devuelve Spring Boot (`TicketCrearRequest.TicketResponse`). */
interface TicketDto {
  id: string;
  asunto: string;
  descripcion: string;
  categoria: string | null;
  prioridad: string;
  estado: string;
  creadoEn: string;
  respuestas?: Array<{
    id: string;
    autorId: string | null;
    cuerpo: string;
    esInterna: boolean;
    creadoEn: string;
  }>;
}

/** DTO `RespuestaTicketResponse`. */
interface RespuestaDto {
  id: string;
  autorId: string | null;
  cuerpo: string;
  esInterna: boolean;
  creadoEn: string;
}

/** Adapta el DTO del backend (camelCase, fecha única) al modelo de dominio del frontend (snake_case). */
function mapearTicket(dto: TicketDto): Ticket {
  const creado = dto?.creadoEn ?? new Date().toISOString();
  return {
    id: dto?.id ?? '',
    usuario_id: '',
    asunto: dto?.asunto ?? '',
    descripcion: dto?.descripcion ?? '',
    categoria: dto?.categoria ?? null,
    prioridad: dto?.prioridad ?? 'media',
    estado: dto?.estado ?? 'abierto',
    entidad_tipo: null,
    entidad_id: null,
    asignado_a: null,
    resuelto_en: null,
    cerrado_en: null,
    valoracion: null,
    clave_idempotencia: null,
    creado_en: creado,
    actualizado_en: creado,
  };
}

/** Extrae el mensaje útil de un error HTTP del backend (`ApiResponse` en el cuerpo). */
function extraerMensajeError(e: unknown, porDefecto: string): string {
  const body: any = (e as HttpErrorResponse)?.error;
  const msgApi = body?.message;
  const errores = Array.isArray(body?.errors) ? body.errors.map((x: any) => x?.message).filter(Boolean) : [];
  if (errores.length) return errores.join(' · ');
  if (typeof msgApi === 'string' && msgApi.trim()) return msgApi;
  if (typeof body === 'string' && body.trim()) return body;
  return (e as Error)?.message || porDefecto;
}

/**
 * Servicio de soporte y tickets.
 *
 * Consume el backend REST API (`/api/v1/soporte`) y normaliza las respuestas
 * al modelo de dominio usado por las vistas. La autenticación viaja en el
 * access token (interceptor); el backend usa el `sub` del JWT.
 */
@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/soporte`;

  // === TICKETS ===

  /** Obtiene los tickets del usuario autenticado (mapeados al modelo de dominio). */
  async listarMisTickets(): Promise<Ticket[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TicketDto[]>>(`${this.baseUrl}/tickets/yo`),
    );
    return (res?.data ?? []).map(mapearTicket);
  }

  /** Obtiene el detalle de un ticket. */
  async obtenerTicket(id: string): Promise<Ticket> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TicketDto>>(`${this.baseUrl}/tickets/${id}`),
    );
    return mapearTicket(res.data as TicketDto);
  }

  /** Crea un nuevo ticket de soporte. Nunca lanza: devuelve `{ ok, mensaje, ticketId? }`. */
  async crearTicket(datos: CrearTicketInput): Promise<CrearTicketResultado> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<TicketDto>>(`${this.baseUrl}/tickets`, {
          asunto: datos.asunto,
          descripcion: datos.descripcion,
          categoria: datos.categoria ?? 'general',
          prioridad: datos.prioridad ?? 'media',
        }),
      );
      const creado = res?.data;
      return {
        ok: true,
        mensaje: 'Ticket creado correctamente. Te responderemos lo antes posible.',
        ticketId: creado?.id,
      };
    } catch (e) {
      return {
        ok: false,
        mensaje: extraerMensajeError(e, 'No se pudo crear el ticket.'),
      };
    }
  }

  /** Responde a un ticket. Devuelve `{ ok, mensaje }` (nunca lanza). */
  async responder(ticketId: string, mensaje: string): Promise<CrearTicketResultado> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<RespuestaDto>>(
          `${this.baseUrl}/tickets/${ticketId}/mensajes`,
          { cuerpo: mensaje },
        ),
      );
      return { ok: true, mensaje: 'Mensaje enviado.', ticketId: ticketId };
    } catch (e) {
      return { ok: false, mensaje: extraerMensajeError(e, 'No se pudo enviar el mensaje.') };
    }
  }

  /** Cierra un ticket. Devuelve `{ ok, mensaje }` (nunca lanza). */
  async cerrarTicket(ticketId: string): Promise<CrearTicketResultado> {
    try {
      await firstValueFrom(
        this.http.post<ApiResponse<TicketDto>>(
          `${this.baseUrl}/tickets/${ticketId}/cerrar`,
          {},
        ),
      );
      return { ok: true, mensaje: 'Ticket cerrado.', ticketId };
    } catch (e) {
      return { ok: false, mensaje: extraerMensajeError(e, 'No se pudo cerrar el ticket.') };
    }
  }
}
