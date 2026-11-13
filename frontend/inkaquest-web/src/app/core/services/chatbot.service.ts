// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClientService } from './api-client.service';

/** Mensaje de conversación del chatbot (UI/contrato preparado). */
export interface ChatbotMensaje {
  id?: string;
  rol: 'usuario' | 'asistente' | 'sistema';
  contenido: string;
  creado_en?: string;
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

  /** Envía un mensaje y recibe la respuesta del asistente (backend requerido). */
  async enviarMensaje(conversacionId: string | null, contenido: string): Promise<{ conversacion: ChatbotConversacion; mensaje: ChatbotMensaje; respuesta: ChatbotMensaje }> {
    return await firstValueFrom(
      this.api.post<{ conversacion: ChatbotConversacion; mensaje: ChatbotMensaje; respuesta: ChatbotMensaje }>(
        '/chatbot/mensajes',
        { conversacionId, contenido },
      ),
    );
  }
}
