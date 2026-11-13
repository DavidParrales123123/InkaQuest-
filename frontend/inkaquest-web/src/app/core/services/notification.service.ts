// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { Notificacion, NotificacionDestinatario } from '../models/domain.models';

/**
 * Notificacion con su estado de entrega y de lectura.
 *
 * <p>Combina el contenido de {@code public.notificacion} con el estado por
 * destinatario de {@code public.notificacion_destinatario}.</p>
 */
export interface NotificacionCompleta extends Notificacion {
  /** Identificador de la fila de destinatario (para marcar lectura). */
  destinatario_id: string;
  /** Estado de entrega al destinatario. */
  estado_entrega: string;
  /** Fecha de lectura, si ya fue leida. */
  leida_en: string | null;
}

/**
 * Servicio de notificaciones.
 *
 * <p>Las notificaciones se leen de dos tablas complementarias:</p>
 * <ul>
 *   <li>{@code notificacion}: el contenido. Su politica de lectura permite ver
 *       las dirigidas al propio usuario ({@code destinatario_id}).</li>
 *   <li>{@code notificacion_destinatario}: el estado por destinatario
 *       (canal, entrega, lectura).</li>
 * </ul>
 *
 * <p>El usuario solo puede marcar como leidas sus propias filas: la politica
 * {@code pol_notificacion_destinatario_update} lo restringe a su
 * {@code usuario_id}.</p>
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Notificaciones del usuario con su estado de lectura.
   *
   * @param usuarioId identificador del usuario
   */
  async listarNotificaciones(usuarioId: string): Promise<NotificacionCompleta[]> {
    const { data: destinatarios, error: errorDestinatarios } = await this.supabase.client
      .from(this.supabase.tabla.notificacionDestinatario)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (errorDestinatarios) {
      throw new Error(errorDestinatarios.message);
    }

    const filas = (destinatarios ?? []) as NotificacionDestinatario[];
    if (filas.length === 0) {
      return [];
    }

    const ids = filas.map((f) => f.notificacion_id);

    const { data: notificacionesRaw, error: errorNotificaciones } = await this.supabase.client
      .from(this.supabase.tabla.notificacion)
      .select('*')
      .in('id', ids);

    if (errorNotificaciones) {
      throw new Error(errorNotificaciones.message);
    }

    const notificaciones = (notificacionesRaw ?? []) as Notificacion[];
    const porId = new Map(notificaciones.map((n) => [n.id, n]));

    const resultado: NotificacionCompleta[] = [];
    for (const fila of filas) {
      const notificacion = porId.get(fila.notificacion_id);
      if (!notificacion) {
        // La notificacion puede no ser visible por RLS (por ejemplo, un
        // aviso general). Se omite en lugar de mostrar informacion parcial.
        continue;
      }
      resultado.push({
        ...notificacion,
        destinatario_id: fila.id,
        estado_entrega: fila.estado,
        leida_en: fila.leida_en,
      });
    }

    return resultado;
  }

  /** Numero de notificaciones no leidas. */
  async contarNoLeidas(usuarioId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(this.supabase.tabla.notificacionDestinatario)
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .is('leida_en', null);

    if (error) {
      return 0;
    }
    return count ?? 0;
  }

  /** Marca una notificacion como leida. */
  async marcarLeida(destinatarioId: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.notificacionDestinatario)
        .update({ leida_en: new Date().toISOString() })
        .eq('id', destinatarioId);

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Notificación marcada como leída.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo marcar la notificación.',
      };
    }
  }

  /** Marca todas las notificaciones del usuario como leidas. */
  async marcarTodasLeidas(usuarioId: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.notificacionDestinatario)
        .update({ leida_en: new Date().toISOString() })
        .eq('usuario_id', usuarioId)
        .is('leida_en', null);

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Todas las notificaciones fueron marcadas como leídas.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudieron marcar las notificaciones.',
      };
    }
  }
}
