// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import {
  Actividad,
  Categoria,
  Contenido,
  Curso,
  Leccion,
  Modulo,
  Recurso,
  Unidad,
} from '../models/domain.models';
import { SupabaseService } from './supabase.service';

/** Curso público enriquecido con su categoría embebida. */
export type CursoConCategoria = Curso & {
  categoria?: Pick<Categoria, 'id' | 'nombre' | 'slug' | 'icono' | 'orden'> | null;
};

export interface UnidadConModulos extends Unidad {
  modulos: (Modulo & { lecciones: Leccion[] })[];
}

/**
 * Servicio del catálogo académico: cursos y su contenido.
 *
 * <p>Las lecturas públicas del catálogo (cursos, categorías, estructura,
 * actividades) se hacen directamente contra Supabase/PostgreSQL protegido con
 * RLS: la política {@code pol_curso_select} solo deja ver cursos publicados a
 * anónimos y usuarios autenticados.</p>
 *
 * <p>La matrícula (escritura) sigue pasando por la API REST de Spring Boot,
 * que valida precios y reglas de negocio en el servidor.</p>
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;

  // === CATÁLOGO PÚBLICO ===

  /**
   * Lista cursos publicados (RLS) con búsqueda y filtro por categoría.
   *
   * @param q          texto a buscar en título/descripción
   * @param categoriaId filtro por categoría (puede ser '' o undefined para todo)
   * @param limite      tope de resultados (por defecto 60)
   */
  async listarPublicos(opciones: {
    q?: string;
    categoriaId?: string;
    limite?: number;
  } = {}): Promise<CursoConCategoria[]> {
    let consulta = this.client
      .from(this.supabase.tabla.curso)
      .select('*, categoria:categoria_id(id, nombre, slug, icono, orden)')
      .eq('estado', 'publicado')
      .order('publicado_en', { ascending: false, nullsFirst: false })
      .limit(opciones.limite ?? 60);

    const busqueda = opciones.q?.trim();
    if (busqueda) {
      // Se eliminan caracteres de la sintaxis .or() de PostgREST.
      const limpio = busqueda.replace(/[,()]/g, ' ').trim();
      if (limpio) {
        const patron = `%${limpio}%`;
        consulta = consulta.or(`titulo.ilike.${patron},descripcion.ilike.${patron}`);
      }
    }
    if (opciones.categoriaId) {
      consulta = consulta.eq('categoria_id', opciones.categoriaId);
    }

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando el catálogo:', error.message);
      throw new Error('No se pudieron cargar los cursos.');
    }
    return (data ?? []) as CursoConCategoria[];
  }

  /** Obtiene el detalle de un curso por su slug (la RLS decide quién lo ve). */
  async obtenerPorSlug(slug: string): Promise<CursoConCategoria | null> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.curso)
      .select('*, categoria:categoria_id(id, nombre, slug, icono, orden)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) {
      console.error('[InkaQuest] Error cargando el curso:', error.message);
      throw new Error('No se pudo cargar el curso.');
    }
    return (data ?? null) as CursoConCategoria | null;
  }

  /** Obtiene un curso por su id (publicado). */
  async obtenerPorId(id: string): Promise<CursoConCategoria | null> {
    if (!id) return null;
    const { data, error } = await this.client
      .from(this.supabase.tabla.curso)
      .select('*, categoria:categoria_id(id, nombre, slug, icono, orden)')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('[InkaQuest] Error cargando el curso:', error.message);
      throw new Error('No se pudo cargar el curso.');
    }
    return (data ?? null) as CursoConCategoria | null;
  }

  /** Lista las categorías activas del catálogo. */
  async listarCategorias(): Promise<Categoria[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.categoria)
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (error) {
      console.error('[InkaQuest] Error cargando categorías:', error.message);
      throw new Error('No se pudieron cargar las categorías.');
    }
    return (data ?? []) as Categoria[];
  }

  /** Actividades publicadas de un curso (por curso_id). */
  async listarActividadesPublicadas(cursoId: string): Promise<Actividad[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .eq('curso_id', cursoId)
      .eq('publicado', true)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando actividades:', error.message);
      return [];
    }
    return (data ?? []) as Actividad[];
  }

  /** Contenido de una lección (ordenado). */
  async listarContenido(leccionId: string): Promise<Contenido[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.contenido)
      .select('*')
      .eq('leccion_id', leccionId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando contenidos de la lección:', error.message);
      return [];
    }
    return (data ?? []) as Contenido[];
  }

  /** Recursos asociados a una lección. */
  async listarRecursos(leccionId: string): Promise<Recurso[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.recurso)
      .select('*')
      .eq('leccion_id', leccionId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('[InkaQuest] Error cargando recursos de la lección:', error.message);
      return [];
    }
    return (data ?? []) as Recurso[];
  }

  /** Estructura pública del curso: unidades → módulos → lecciones publicadas. */
  async obtenerEstructura(cursoId: string): Promise<{ unidades: UnidadConModulos[] }> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.unidad)
      .select('*, modulos:modulo(*, lecciones:leccion(*))')
      .eq('curso_id', cursoId);
    if (error) {
      console.error('[InkaQuest] Error cargando la estructura:', error.message);
      throw new Error('No se pudo cargar el contenido del curso.');
    }
    const porNumero = (a: { numero?: number }, b: { numero?: number }) =>
      (a?.numero ?? 0) - (b?.numero ?? 0);
    const unidades = ((data ?? []) as any[])
      .filter((u) => u?.publicado !== false)
      .sort(porNumero)
      .map((u) => ({
        ...u,
        modulos: ((u.modulos ?? []) as any[])
          .filter((m) => m?.publicado !== false)
          .sort(porNumero)
          .map((m) => ({
            ...m,
            lecciones: ((m.lecciones ?? []) as any[])
              .filter((l) => l?.publicado !== false)
              .sort(porNumero),
          })),
      })) as UnidadConModulos[];
    return { unidades };
  }

  /** Actividades publicadas del curso (vacío si el usuario no es autenticado). */
  async listarActividades(cursoId: string): Promise<Actividad[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .eq('curso_id', cursoId)
      .eq('publicado', true)
      .order('creado_en', { ascending: true });
    if (error) {
      console.error('[InkaQuest] Error cargando actividades:', error.message);
      return [];
    }
    return (data ?? []) as Actividad[];
  }

  /** Lista los cursos en los que el estudiante está matriculado (solo los propios). */
  async listarCursosDeEstudiante(_estudianteId: string): Promise<Curso[]> {
    // Lectura directa por Supabase+RLS: matricula embebida con su curso.
    // Se acota explícitamente al propio estudiante aunque la RLS permita ver más en admin/docente.
    const { data, error } = await this.client
      .from(this.supabase.tabla.matricula)
      .select('curso:curso_id(*)')
      .eq('estudiante_id', _estudianteId || '00000000-0000-0000-0000-000000000000')
      .order('matriculado_en', { ascending: false, nullsFirst: true });

    if (error) {
      console.error('[InkaQuest] Error cargando cursos del estudiante:', error.message);
      return [];
    }

    return (data ?? []).map((r: any) => r?.curso).filter(Boolean) as Curso[];
  }

  // === GESTIÓN DOCENTE ===
  //
  // Estas escrituras pasan directo por Supabase; la RLS (`pol_*_write`) exige
  // que el autor sea el docente del curso (o admin). El frontend no es fuente
  // de confianza: cualquier intento indebido se rechaza en el servidor.

  /** Estructura COMPLETA para edición (incluye borradores, como el docente dueño). */
  async obtenerEstructuraGestion(cursoId: string): Promise<{ unidades: UnidadConModulos[] }> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.unidad)
      .select('*, modulos:modulo(*, lecciones:leccion(*))')
      .eq('curso_id', cursoId)
      .order('numero', { ascending: true })
      .order('numero', { ascending: true, referencedTable: 'modulos' })
      .order('numero', { ascending: true, referencedTable: 'modulos.lecciones' });
    if (error) {
      console.error('[InkaQuest] Error cargando la estructura del curso (docente):', error.message);
      throw new Error('No se pudo cargar la estructura de gestión del curso.');
    }
    const porNumero = (a: { numero?: number }, b: { numero?: number }) => (a?.numero ?? 0) - (b?.numero ?? 0);
    const unidades = ((data ?? []) as any[])
      .sort(porNumero)
      .map((u) => ({
        ...u,
        modulos: ((u.modulos ?? []) as any[]).sort(porNumero).map((m) => ({
          ...m,
          lecciones: ((m.lecciones ?? []) as any[]).sort(porNumero),
        })),
      })) as UnidadConModulos[];
    return { unidades };
  }

  /** Crea una unidad en el curso (solo docente del curso o admin; lo exige la RLS). */
  async crearUnidad(cursoId: string, datos: { numero: number; titulo: string; descripcion?: string | null; publicado?: boolean }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.unidad).insert({ curso_id: cursoId, numero: datos.numero, titulo: datos.titulo, descripcion: datos.descripcion ?? null, publicado: datos.publicado ?? false });
    if (error) throw new Error(error.message);
  }

  /** Actualiza parcialmente una unidad (hoy: publicado). */
  async actualizarUnidad(id: string, cambios: { publicado?: boolean; titulo?: string; descripcion?: string | null; numero?: number }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.unidad).update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Elimina una unidad (cascada: módulos y lecciones; lo exige la integridad referencial). */
  async eliminarUnidad(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.unidad).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Crea un módulo dentro de una unidad. */
  async crearModulo(unidadId: string, datos: { numero: number; titulo: string; descripcion?: string | null; publicado?: boolean }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.modulo).insert({ unidad_id: unidadId, numero: datos.numero, titulo: datos.titulo, descripcion: datos.descripcion ?? null, publicado: datos.publicado ?? false });
    if (error) throw new Error(error.message);
  }

  /** Actualiza parcialmente un módulo (hoy: publicado). */
  async actualizarModulo(id: string, cambios: { publicado?: boolean; titulo?: string; descripcion?: string | null; numero?: number }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.modulo).update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Elimina un módulo (cascada a lecciones/contenidos). */
  async eliminarModulo(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.modulo).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Crea una lección dentro de un módulo. */
  async crearLeccion(moduloId: string, datos: { numero: number; titulo: string; descripcion?: string | null; duracion_minutos?: number; tipo_contenido?: string; publicado?: boolean; xp_otorgado?: number }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.leccion).insert({ modulo_id: moduloId, numero: datos.numero, titulo: datos.titulo, descripcion: datos.descripcion ?? null, duracion_minutos: datos.duracion_minutos ?? 0, tipo_contenido: datos.tipo_contenido ?? 'texto', publicado: datos.publicado ?? false, xp_otorgado: datos.xp_otorgado ?? 0 });
    if (error) throw new Error(error.message);
  }

  /** Actualiza parcialmente una lección (hoy: publicado y datos básicos). */
  async actualizarLeccion(id: string, cambios: { publicado?: boolean; titulo?: string; descripcion?: string | null; numero?: number; duracion_minutos?: number; tipo_contenido?: string; xp_otorgado?: number }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.leccion).update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Elimina una lección (cascada a contenidos y recursos). */
  async eliminarLeccion(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.leccion).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Crea un bloque de contenido ordenado dentro de una lección. Devuelve la fila creada. */
  async crearContenido(leccionId: string, datos: { orden: number; tipo: string; titulo?: string | null; cuerpo?: string | null; datos?: Record<string, unknown> }): Promise<Contenido> {
    const { data, error } = await this.client.from(this.supabase.tabla.contenido).insert({ leccion_id: leccionId, orden: datos.orden, tipo: datos.tipo, titulo: datos.titulo?.trim() || null, cuerpo: datos.cuerpo ?? null, datos: datos.datos ?? {} }).select().single();
    if (error) throw new Error(error.message);
    return data as Contenido;
  }

  /** Elimina un bloque de contenido. */
  async eliminarContenido(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.contenido).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Asocia un recurso (archivo en storage, enlace o video) a una lección. */
  async crearRecurso(leccionId: string, datos: { nombre: string; tipo: string; ruta_storage?: string | null; url?: string | null; tamano_bytes?: number | null; mime_type?: string | null; descargable?: boolean; contenido_id?: string | null }): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.recurso).insert({ leccion_id: leccionId, nombre: datos.nombre, tipo: datos.tipo, ruta_storage: datos.ruta_storage ?? null, url: datos.url ?? null, tamano_bytes: datos.tamano_bytes ?? null, mime_type: datos.mime_type ?? null, descargable: datos.descargable ?? false, contenido_id: datos.contenido_id ?? null });
    if (error) throw new Error(error.message);
  }

  /** Elimina un recurso (el archivo de Storage se borra por separado desde el caller). */
  async eliminarRecurso(id: string): Promise<void> {
    const { error } = await this.client.from(this.supabase.tabla.recurso).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

// === INTERFACES ===

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
