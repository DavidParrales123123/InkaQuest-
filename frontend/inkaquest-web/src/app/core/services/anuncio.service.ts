// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Anuncio, EstadoAnuncio } from '../models/domain.models';

/**
 * Servicio de anuncios del docente.
 *
 * <p>Modelo de seguridad: el docente gestiona los anuncios de los cursos que
 * le están asignados (RLS lo obliga en todas las operaciones). Los estudiantes
 * del curso pueden leer los publicados.</p>
 */
@Injectable({ providedIn: 'root' })
export class AnuncioService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  /** Lista los anuncios visibles: los propios, o todos si es administrador. */
  async listarMisAnuncios(cursoId?: string): Promise<Anuncio[]> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return [];
    }
    let query = this.supabase.client
      .from(this.supabase.tabla.anuncio)
      .select('*');

    // Un docente solo gestiona sus anuncios; el admin ve todos.
    if (this.auth.rol() !== 'administrador') {
      query = query.eq('docente_id', usuario.id);
    }
    if (cursoId) {
      query = query.eq('curso_id', cursoId);
    }
    const { data, error } = await query
      .order('fijado', { ascending: false })
      .order('creado_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Anuncio[];
  }

  /**
   * Crea un anuncio. El estado por defecto es 'publicado'.
   *
   * <p>RLS exige que el docente esté asignado al curso y sea el autor.</p>
   */
  async crear(datos: { curso_id: string; titulo: string; contenido: string; estado?: EstadoAnuncio; fijado?: boolean }): Promise<Anuncio> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      throw new Error('Debes iniciar sesión.');
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.anuncio)
      .insert({
        curso_id: datos.curso_id,
        docente_id: usuario.id,
        titulo: datos.titulo.trim(),
        contenido: datos.contenido.trim(),
        estado: datos.estado ?? 'publicado',
        fijado: datos.fijado ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Anuncio;
  }

  /** Actualiza título/contenido/estado/fijado de un anuncio. */
  async actualizar(id: string, cambios: Partial<Pick<Anuncio, 'titulo' | 'contenido' | 'estado' | 'fijado'>>): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.anuncio)
      .update(cambios)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  /** Elimina un anuncio (definitivo). */
  async eliminar(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.anuncio)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}
