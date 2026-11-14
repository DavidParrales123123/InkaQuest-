// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Mensaje, Perfil } from '../models/domain.models';

/** Resumen de un hilo (conversación) para el panel lateral. */
export interface HiloResumen {
  /** UUID de la otra persona. */
  otroId: string;
  /** Nombre para mostrar. */
  nombre: string;
  /** Correo de la otra persona. */
  email: string;
  /** Último mensaje del hilo. */
  ultimoMensaje: string;
  /** Fecha del último mensaje (ISO). */
  ultimoEn: string;
  /** Mensajes míos sin leer (los que la otra persona envió y yo no he leído). */
  noLeidos: number;
}

/** Miembro del curso (docente o estudiante), con perfil y rol. */
export type MiembroCurso = Perfil & { rol: 'docente' | 'estudiante' };

/**
 * Servicio de mensajería 1 a 1.
 *
 * <p>Mensajes entre dos usuarios cualesquiera autenticados: estudiantes de un
 * mismo curso, docente↔estudiante, etc. La RLS de {@code mensaje} solo exige
 * que el emisor sea el propio usuario y que emisor/destinatario puedan leer sus
 * propios hilos. La migración 20261112000002 permite que estudiantes se vean
 * entre sí dentro del mismo curso.</p>
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  /** Lista los hilos del usuario actual, con nombre/avatar y no leídos. */
  async listarHilos(): Promise<HiloResumen[]> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return [];
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.mensaje)
      .select('*')
      .or(`emisor_id.eq.${usuario.id},destinatario_id.eq.${usuario.id}`)
      .eq('borrado_por_emisor', false)
      .order('creado_en', { ascending: false })
      .limit(300);

    if (error) {
      throw new Error(error.message);
    }

    const filas = (data ?? []) as Mensaje[];
    const otros = new Map<string, { ultimo: Mensaje; noLeidos: number }>();

    for (const m of filas) {
      const otroId = m.emisor_id === usuario.id ? m.destinatario_id : m.emisor_id;
      const entry = otros.get(otroId);
      if (entry) {
        if (m.destinatario_id === usuario.id && !m.leido_en) {
          entry.noLeidos += 1;
        }
        // filas vienen ordenadas desc → el primero de cada grupo es el último.
      } else {
        otros.set(otroId, {
          ultimo: m,
          noLeidos: m.destinatario_id === usuario.id && !m.leido_en ? 1 : 0,
        });
      }
    }

    const ids = [...otros.keys()];
    const perfiles = await this.listarPerfiles(ids);
    const porId = new Map(perfiles.map((p) => [p.id, p]));

    return [...otros.entries()].map(([otroId, { ultimo, noLeidos }]) => {
      const perfil = porId.get(otroId);
      const nombre = perfil
        ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim() || perfil.email
        : 'Usuario';
      return {
        otroId,
        nombre,
        email: perfil?.email ?? '',
        ultimoMensaje: ultimo.cuerpo,
        ultimoEn: ultimo.creado_en,
        noLeidos,
      };
    }).sort((a, b) => b.ultimoEn.localeCompare(a.ultimoEn));
  }

  /** Mensajes entre el usuario actual y otro usuario, en orden cronológico. */
  async listarMensajes(otroId: string): Promise<Mensaje[]> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return [];
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.mensaje)
      .select('*')
      .or(`and(emisor_id.eq.${usuario.id},destinatario_id.eq.${otroId}),and(emisor_id.eq.${otroId},destinatario_id.eq.${usuario.id})`)
      .or('borrado_por_emisor.eq.false,borrado_por_destinatario.eq.false')
      .order('creado_en', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Mensaje[];
  }

  /** Envía un mensaje reutilizando el hilo existente entre ambos usuarios. */
  async enviar(otroId: string, cuerpo: string): Promise<Mensaje> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      throw new Error('Debes iniciar sesión.');
    }
    const texto = cuerpo.trim();
    if (!texto) {
      throw new Error('Escribe un mensaje.');
    }

    // Reutiliza el hilo_id del intercambio anterior, o crea uno nuevo.
    const { data: existente } = await this.supabase.client
      .from(this.supabase.tabla.mensaje)
      .select('hilo_id')
      .or(`and(emisor_id.eq.${usuario.id},destinatario_id.eq.${otroId}),and(emisor_id.eq.${otroId},destinatario_id.eq.${usuario.id})`)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hilo = (existente?.['hilo_id'] as string | undefined) ?? crypto.randomUUID();

    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.mensaje)
      .insert({
        emisor_id: usuario.id,
        destinatario_id: otroId,
        hilo_id: hilo,
        cuerpo: texto,
        adjuntos: [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Mensaje;
  }

  /** Marca como leídos los mensajes que la otra persona me envió. */
  async marcarLeidos(otroId: string): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    await this.supabase.client
      .from(this.supabase.tabla.mensaje)
      .update({ leido_en: new Date().toISOString() })
      .eq('destinatario_id', usuario.id)
      .eq('emisor_id', otroId)
      .is('leido_en', null);
  }

  /** Busca perfiles visibles para el usuario actual (compañeros de curso, docentes, etc.). */
  async buscarContactos(texto: string): Promise<Perfil[]> {
    const q = texto.trim();
    if (q.length < 2) {
      return [];
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('id, nombre, apellido, email, avatar_url')
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', this.auth.usuario()?.id ?? '')
      .limit(20);

    if (error) {
      return [];
    }
    return (data ?? []) as Perfil[];
  }

  /** Miembros del curso vía RPC segura (security definer con acceso acotado al propio curso). */
  async listarMiembrosCurso(cursoId: string): Promise<MiembroCurso[]> {
    const { data, error } = await this.supabase.client.rpc('chat_miembros_curso', {
      p_curso_id: cursoId,
    });
    if (error) {
      throw new Error(error.message ?? 'No se pudieron cargar los miembros del curso.');
    }
    const filas = (data ?? []) as Array<Record<string, unknown>>;
    const propio = this.auth.usuario()?.id;
    return filas
      .map((f) => {
        const id = String(f['id'] ?? '');
        const rol = (f['rol'] === 'docente' ? 'docente' : 'estudiante') as 'docente' | 'estudiante';
        return {
          id,
          nombre: (f['nombre'] as string) ?? '',
          apellido: (f['apellido'] as string | null) ?? null,
          email: (f['email'] as string) ?? '',
          avatar_url: (f['avatar_url'] as string | null) ?? null,
          rol,
        } as Perfil & { rol: 'docente' | 'estudiante' };
      })
      .filter((p) => p.id !== propio)
      .sort((a, b) => {
        if (a.rol !== b.rol) return a.rol === 'docente' ? -1 : 1;
        const na = (a.apellido ?? '') || a.nombre;
        const nb = (b.apellido ?? '') || b.nombre;
        return na.localeCompare(nb, 'es', { sensitivity: 'base' });
      });
  }

  /** Perfiles por ids (solo lectura). */
  private async listarPerfiles(ids: string[]): Promise<Perfil[]> {
    if (ids.length === 0) {
      return [];
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('id, nombre, apellido, email, avatar_url')
      .in('id', ids);

    if (error) {
      throw new Error(`No se pudieron cargar los perfiles de los miembros: ${error.message}`);
    }
    return (data ?? []) as Perfil[];
  }
}
