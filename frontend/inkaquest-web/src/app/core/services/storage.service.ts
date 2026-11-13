// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly supabase = inject(SupabaseService);

  /** Sube la portada de un curso al bucket público portadas-curso y devuelve su ruta/URL pública. */
  async subirPortadaCurso(archivo: File): Promise<{ ruta: string; url: string }> {
    const limpio = archivo.name.replace(/[^\w.\-() ]+/g, '_');
    const stamp = Date.now();
    const id = crypto.randomUUID();
    const ruta = 'portadas/' + stamp + '-' + id + '-' + limpio;
    const { error } = await this.supabase.client.storage.from('portadas-curso').upload(ruta, archivo, {
      cacheControl: '3600', upsert: false, contentType: archivo.type || undefined,
    });
    if (error) throw new Error(error.message);
    const { data } = this.supabase.client.storage.from('portadas-curso').getPublicUrl(ruta);
    return { ruta, url: data.publicUrl };
  }

  async subirRecursoCurso(cursoId: string, archivo: File): Promise<{ ruta: string; url: string | null }> {
    const limpio = archivo.name.replace(/[^\w.\-() ]+/g, '_');
    const ruta = cursoId + '/' + Date.now() + '-' + crypto.randomUUID() + '-' + limpio;
    const { error } = await this.supabase.client.storage
      .from('recursos')
      .upload(ruta, archivo, { cacheControl: '3600', upsert: false, contentType: archivo.type || undefined });
    if (error) throw new Error(error.message);
    // bucket privado: url firmada temporal para referencia opcional; acceso real via signed url segun contexto
    const { data } = await this.supabase.client.storage.from('recursos').createSignedUrl(ruta, 60 * 60);
    return { ruta, url: data?.signedUrl ?? null };
  }

  async obtenerUrlRecurso(ruta: string, expiraSeg = 3600): Promise<string | null> {
    const { data, error } = await this.supabase.client.storage.from('recursos').createSignedUrl(ruta, expiraSeg);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  async eliminarRecurso(ruta: string): Promise<void> {
    const { error } = await this.supabase.client.storage.from('recursos').remove([ruta]);
    if (error) throw new Error(error.message);
  }
}