// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClientService } from './api-client.service';

/** Adjunto a enviar junto al mensaje (ya subido al bucket privado 'chat'). */
export interface ChatbotAdjunto {
  ruta: string;
  url: string;
  mime: string;
  nombre: string;
  tamano: number;
}

/** Mensaje de conversación del chatbot (UI/contrato preparado). */
export interface ChatbotMensaje {
  id?: string;
  rol: 'usuario' | 'asistente' | 'sistema';
  contenido: string;
  creado_en?: string;
  datos?: Record<string, unknown>;
}

/** Conversación del chatbot (UI/contrato preparado). */
export interface ChatbotConversacion {
  id: string;
  titulo?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

/**
 * Servicio de chatbot (integración preparada).
 *
 * <p>La IA y las consultas a datos deben ejecutarse en el backend (sin exponer
 * claves). Este servicio encapsula las llamadas HTTP previstas; los endpoints
 * pueden no existir aún y deben implementarse/validarse en el backend según
 * permisos y RLS/reglas de negocio.</p>
 */
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly api = inject(ApiClientService);

  /** Lista conversaciones del usuario autenticado (backend requerido). */
  async listarConversaciones(): Promise<ChatbotConversacion[]> {
    return await firstValueFrom(this.api.get<ChatbotConversacion[]>('/chatbot/conversaciones'));
  }

  /** Obtiene mensajes de una conversación (backend requerido). */
  async listarMensajes(conversacionId: string): Promise<ChatbotMensaje[]> {
    return await firstValueFrom(
      this.api.get<ChatbotMensaje[]>(`/chatbot/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`),
    );
  }

  /** Crea una nueva conversación (backend requerido). */
  async crearConversacion(titulo?: string): Promise<ChatbotConversacion> {
    return await firstValueFrom(this.api.post<ChatbotConversacion>('/chatbot/conversaciones', { titulo }));
  }

  /** Envía un mensaje (texto y/o adjuntos) y recibe la respuesta del asistente. */
  async enviarMensaje(
    conversacionId: string | null,
    contenido: string,
    attachments: ChatbotAdjunto[] = [],
  ): Promise<{ conversacion: ChatbotConversacion; mensaje: ChatbotMensaje; respuesta: ChatbotMensaje }> {
    return await firstValueFrom(
      this.api.post<{ conversacion: ChatbotConversacion; mensaje: ChatbotMensaje; respuesta: ChatbotMensaje }>(
        '/chatbot/mensajes',
        { conversacionId, contenido, attachments },
      ),
    );
  }
}
