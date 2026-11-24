// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';

export interface Foro {
  id: string;
  curso_id: string;
  titulo: string;
  descripcion: string | null;
}

export interface ForoAutoria {
  nombre: string;
  apellido: string | null;
  email: string;
}

export interface ForoTema {
  id: string;
  foro_id: string;
  autor_id: string;
  titulo: string;
  cuerpo: string;
  fijado: boolean;
  cerrado: boolean;
  creado_en: string;
  actualizado_en: string;
  ultima_actividad_en: string;
  autor?: ForoAutoria | null;
  respuestas?: number;
}

export interface ForoRespuesta {
  id: string;
  tema_id: string;
  autor_id: string;
  cuerpo: string;
  es_solucion: boolean;
  creado_en: string;
  autor?: ForoAutoria | null;
}

/**
 * Foros de comunidad por curso. Todas las operaciones pasan por RLS:
 * solo miembros del curso pueden leer y solo el autor/docente puede moderar.
 */
@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly supabase = inject(SupabaseService);

  private get client() { return this.supabase.client; }

  /** Devuelve el id del foro del curso, creándolo si no existe. */
  async asegurarForo(cursoId: string): Promise<string | null> {
    const { data, error } = await this.client.rpc('fn_foro_asegurar', { p_curso_id: cursoId });
    if (error) {
      console.error('[InkaQuest] Error asegurando el foro:', error.message);
      return null;
    }
    return (data as string) ?? null;
  }

  async listarTemas(foroId: string): Promise<ForoTema[]> {
    const { data, error } = await this.client
      .from('foro_tema')
      .select('*, autor:autor_id(nombre, apellido, email)')
      .eq('foro_id', foroId)
      .order('fijado', { ascending: false })
      .order('ultima_actividad_en', { ascending: false });
    if (error) throw new Error(error.message);

    const temas = (data ?? []) as ForoTema[];
    if (temas.length === 0) return temas;

    const { data: respuestas } = await this.client
      .from('foro_respuesta')
      .select('tema_id')
      .in('tema_id', temas.map((t) => t.id));
    const conteo = new Map<string, number>();
    (respuestas ?? []).forEach((r: any) => conteo.set(r.tema_id, (conteo.get(r.tema_id) ?? 0) + 1));
    return temas.map((t) => ({ ...t, respuestas: conteo.get(t.id) ?? 0 }));
  }

  async listarRespuestas(temaId: string): Promise<ForoRespuesta[]> {
    const { data, error } = await this.client
      .from('foro_respuesta')
      .select('*, autor:autor_id(nombre, apellido, email)')
      .eq('tema_id', temaId)
      .order('creado_en', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ForoRespuesta[];
  }

  async crearTema(foroId: string, autorId: string, titulo: string, cuerpo: string): Promise<ForoTema> {
    const { data, error } = await this.client
      .from('foro_tema')
      .insert({ foro_id: foroId, autor_id: autorId, titulo: titulo.trim(), cuerpo: cuerpo.trim() })
      .select('*, autor:autor_id(nombre, apellido, email)')
      .single();
    if (error) throw new Error(error.message);
    return data as ForoTema;
  }

  async crearRespuesta(temaId: string, autorId: string, cuerpo: string): Promise<ForoRespuesta> {
    const { data, error } = await this.client
      .from('foro_respuesta')
      .insert({ tema_id: temaId, autor_id: autorId, cuerpo: cuerpo.trim() })
      .select('*, autor:autor_id(nombre, apellido, email)')
      .single();
    if (error) throw new Error(error.message);
    return data as ForoRespuesta;
  }

  async fijarTema(temaId: string, fijado: boolean): Promise<void> {
    const { error } = await this.client.from('foro_tema').update({ fijado }).eq('id', temaId);
    if (error) throw new Error(error.message);
  }

  async cerrarTema(temaId: string, cerrado: boolean): Promise<void> {
    const { error } = await this.client.from('foro_tema').update({ cerrado }).eq('id', temaId);
    if (error) throw new Error(error.message);
  }

  async eliminarTema(temaId: string): Promise<void> {
    const { error } = await this.client.from('foro_tema').delete().eq('id', temaId);
    if (error) throw new Error(error.message);
  }
}
