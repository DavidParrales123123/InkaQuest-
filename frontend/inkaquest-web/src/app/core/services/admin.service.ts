// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import {
  Actividad,
  AuditoriaAcceso,
  Certificado,
  Configuracion,
  Cupon,
  Curso,
  DocenteCurso,
  Evaluacion,
  Leccion,
  Notificacion,
  ParametroSistema,
  Perfil,
  Permiso,
  Recurso,
  RegistroAccion,
  SolicitudDocente,
  EstadoSolicitudDocente,
  TiendaItem,
  Unidad,
} from '../models/domain.models';

/**
 * Servicio del panel de administracion.
 *
 * <p>Las politicas RLS reservan la escritura de estas tablas al
 * administrador ({@code app_is_admin()}). Por eso el frontend de
 * administrador trabaja con lecturas, y deja las acciones de escritura
 * sensibles (aprobar una solicitud, cambiar el estado de un curso) en el
 * backend, que debe validarlas.</p>
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly supabase = inject(SupabaseService);

  /* --------------------------------------------------------- Usuarios --- */

  /** Listado de usuarios, con filtro opcional por rol. */
  async listarUsuarios(filtros: { rol?: string; busqueda?: string; limite?: number } = {}): Promise<Perfil[]> {
    let consulta = this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(filtros.limite ?? 100);

    if (filtros.rol) {
      consulta = consulta.eq('rol', filtros.rol);
    }

    if (filtros.busqueda?.trim()) {
      const termino = `%${filtros.busqueda.trim()}%`;
      consulta = consulta.or(`nombre.ilike.${termino},email.ilike.${termino}`);
    }

    const { data, error } = await consulta;
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Perfil[];
  }

  /** Detalle de un usuario. */
  async obtenerUsuario(id: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.perfil)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return null;
    }
    return (data as Perfil) ?? null;
  }

  /** Cambia el estado de la cuenta de un usuario. */
  async cambiarEstadoCuenta(
    usuarioId: string,
    estado: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .update({ estado_cuenta: estado })
        .eq('id', usuarioId);

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Estado de la cuenta actualizado.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo actualizar la cuenta.',
      };
    }
  }

  /* -------------------------------------------------- Consultas admin --- */

  /** Lista todos los permisos definidos (lectura administrativa). */
  async listarPermisos(): Promise<Permiso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.permiso)
      .select('*')
      .order('modulo')
      .order('codigo');
    if (error) throw new Error(error.message);
    return (data ?? []) as Permiso[];
  }

  /** Listado administrativo de cupones (incluye inactivos). */
  async listarCuponesAdmin(): Promise<Cupon[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.cupon)
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Cupon[];
  }

  /** Listado administrativo de items de tienda. */
  async listarTiendaItemsAdmin(): Promise<TiendaItem[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.tiendaItem)
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TiendaItem[];
  }

  /** Listado administrativo de certificados emitidos. */
  async listarCertificadosAdmin(): Promise<Certificado[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.certificado)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificado[];
  }

  /** Listado administrativo de notificaciones. */
  async listarNotificacionesAdmin(): Promise<Notificacion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.notificacion)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as Notificacion[];
  }

  /** Listado administrativo de unidades (todas, con curso_id). */
  async listarUnidadesAdmin(): Promise<Unidad[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.unidad)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Unidad[];
  }

  /** Listado administrativo de lecciones. */
  async listarLeccionesAdmin(): Promise<Leccion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.leccion)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Leccion[];
  }

  /** Listado administrativo de recursos. */
  async listarRecursosAdmin(): Promise<Recurso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.recurso)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Recurso[];
  }

  /** Listado administrativo de actividades. */
  async listarActividadesAdmin(): Promise<Actividad[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.actividad)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Actividad[];
  }

  /** Listado administrativo de evaluaciones. */
  async listarEvaluacionesAdmin(): Promise<Evaluacion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.evaluacion)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Evaluacion[];
  }

  /** Listado administrativo de eventos de gamificacion (incluye inactivos). */
  async listarEventosGamificacionAdmin(): Promise<import('../models/domain.models').EventoGamificacion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.eventoGamificacion)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').EventoGamificacion[];
  }

  /** Listado administrativo de rankings. */
  async listarRankingsAdmin(): Promise<import('../models/domain.models').Ranking[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.ranking)
      .select('*')
      .order('puntos', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').Ranking[];
  }

  /** Listado administrativo de temporadas. */
  async listarTemporadasAdmin(): Promise<import('../models/domain.models').Temporada[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.temporada)
      .select('*')
      .order('fecha_inicio', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').Temporada[];
  }

  /** Listado administrativo de misiones. */
  async listarMisionesAdmin(): Promise<import('../models/domain.models').Mision[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.mision)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').Mision[];
  }

  /* --------------------------------------------------- Solicitudes --- */

  /** Solicitudes de acceso docente pendientes o en revision. */
  async listarSolicitudesDocente(
    estados: EstadoSolicitudDocente[] = ['pendiente', 'en_revision'],
  ): Promise<SolicitudDocente[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.solicitudDocente)
      .select('*')
      .in('estado', estados)
      .order('creado_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as SolicitudDocente[];
  }

  /**
   * Aprueba una solicitud docente.
   *
   * <p>Intenta aplicar el flujo completo: marcar solicitud como aprobada y
   * promover el rol del usuario a docente (si la sesion admin y RLS/trigger lo
   * permiten). Si el backend/DB gestiona esto con funciones propias, este
   * metodo puede reemplazarse por la llamada RPC/endpoint correspondiente.</p>
   */
  async aprobarSolicitud(
    solicitudId: string,
    adminId: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { data: solicitud, error: errorSolicitud } = await this.supabase.client
        .from(this.supabase.tabla.solicitudDocente)
        .select('id, usuario_id, estado')
        .eq('id', solicitudId)
        .maybeSingle();

      if (errorSolicitud) {
        return { ok: false, mensaje: errorSolicitud.message };
      }
      if (!solicitud?.usuario_id) {
        return { ok: false, mensaje: 'No se encontro la solicitud o el usuario asociado.' };
      }

      const { error } = await this.supabase.client
        .from(this.supabase.tabla.solicitudDocente)
        .update({
          estado: 'aprobada' satisfies EstadoSolicitudDocente,
          revisado_por: adminId,
          revisado_en: new Date().toISOString(),
          motivo_revision: null,
        })
        .eq('id', solicitudId);

      if (error) {
        return { ok: false, mensaje: error.message };
      }

      const { error: errorPerfil } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .update({ rol: 'docente', estado_cuenta: 'activo' })
        .eq('id', solicitud.usuario_id);

      if (errorPerfil) {
        return {
          ok: false,
          mensaje: `Solicitud aprobada, pero no se pudo actualizar el rol del usuario: ${errorPerfil.message}. Verifica permisos/RLS o la función de aprobación en backend.`,
        };
      }

      return { ok: true, mensaje: 'Solicitud aprobada y rol de docente asignado correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo aprobar la solicitud.',
      };
    }
  }

  /** Rechaza una solicitud docente con su motivo. */
  async rechazarSolicitud(
    solicitudId: string,
    adminId: string,
    motivo: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const motivoLimpio = motivo.trim() || 'Solicitud rechazada por el administrador.';
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.solicitudDocente)
        .update({
          estado: 'rechazada' satisfies EstadoSolicitudDocente,
          revisado_por: adminId,
          revisado_en: new Date().toISOString(),
          motivo_revision: motivoLimpio,
        })
        .eq('id', solicitudId);

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Solicitud rechazada.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo rechazar la solicitud.',
      };
    }
  }

  /* --------------------------------------------------------- Cursos --- */

  /** Todos los cursos, incluidos los no publicados. */
  async listarTodosLosCursos(): Promise<Curso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.curso)
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Curso[];
  }

  /** Cambia el estado de publicacion de un curso. */
  async cambiarEstadoCurso(
    cursoId: string,
    estado: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.curso)
        .update({
          estado,
          publicado_en: estado === 'publicado' ? new Date().toISOString() : null,
        })
        .eq('id', cursoId);

      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Estado del curso actualizado.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo actualizar el curso.',
      };
    }
  }

  /* -------------------------------------------- Asignacion docente-curso --- */

  /** Lista todas las asignaciones docente-curso (para administracion). */
  async listarAsignacionesDocenteCurso(): Promise<DocenteCurso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.docenteCurso)
      .select('*')
      .order('asignado_en', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as DocenteCurso[];
  }

  /** Asigna o reactualiza un docente en un curso (upsert por curso_id, docente_id). */
  async asignarDocenteACurso(params: {
    cursoId: string;
    docenteId: string;
    esResponsable?: boolean;
    asignadoPor?: string | null;
  }): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { data: existente, error: errBuscar } = await this.supabase.client
        .from(this.supabase.tabla.docenteCurso)
        .select('id')
        .eq('curso_id', params.cursoId)
        .eq('docente_id', params.docenteId)
        .maybeSingle();
      if (errBuscar) throw new Error(errBuscar.message);

      if (existente?.id) {
        const { error } = await this.supabase.client
          .from(this.supabase.tabla.docenteCurso)
          .update({
            activo: true,
            es_responsable: !!params.esResponsable,
            asignado_por: params.asignadoPor ?? null,
            asignado_en: new Date().toISOString(),
          })
          .eq('id', existente.id);
        if (error) throw new Error(error.message);
        return { ok: true, mensaje: 'Asignación actualizada y activada correctamente.' };
      }

      const { error } = await this.supabase.client.from(this.supabase.tabla.docenteCurso).insert({
        curso_id: params.cursoId,
        docente_id: params.docenteId,
        es_responsable: !!params.esResponsable,
        activo: true,
        asignado_por: params.asignadoPor ?? null,
      });
      if (error) throw new Error(error.message);
      return { ok: true, mensaje: 'Docente asignado al curso correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo asignar el docente al curso (verifica permisos/RLS).',
      };
    }
  }

  /** Activa, desactiva o cambia el rol responsable de una asignacion. */
  async actualizarAsignacionDocenteCurso(
    asignacionId: string,
    cambios: { activo?: boolean; es_responsable?: boolean },
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.docenteCurso)
        .update(cambios)
        .eq('id', asignacionId);
      if (error) throw new Error(error.message);
      return { ok: true, mensaje: 'Asignación actualizada correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo actualizar la asignación.',
      };
    }
  }

  /** Elimina una asignacion docente-curso. */
  async eliminarAsignacionDocenteCurso(asignacionId: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.docenteCurso)
        .delete()
        .eq('id', asignacionId);
      if (error) throw new Error(error.message);
      return { ok: true, mensaje: 'Asignación eliminada correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo eliminar la asignación.',
      };
    }
  }

  /** Actualiza una unidad existente (admin). */
  async actualizarUnidadAdmin(id: string, cambios: Record<string, unknown>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.unidad).update({ ...cambios, actualizado_en: new Date().toISOString() } as Record<string, unknown>).eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Unidad actualizada correctamente.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar la unidad.' };
    }
  }
  /* ---------------------------------------------- Admin creación académica --- */

  /** Categorías activas para selector de creación de cursos. */
  async listarCategoriasAdmin(): Promise<import('../models/domain.models').Categoria[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.categoria).select('*').eq('activo', true).order('orden').order('nombre');
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').Categoria[];
  }

  /** Crea un curso (admin) con portada, precio y XP. */
  async crearCursoAdmin(datos: {
    titulo: string; slug?: string; descripcion?: string | null; contenido?: string | null;
    categoria_id?: string | null; portada_url?: string | null; estado?: string; precio?: number; moneda?: string;
    xp_total?: number; duracion_minutos?: number; creado_por?: string | null;
  }): Promise<{ ok: boolean; mensaje: string; id?: string; slug?: string }> {
    try {
      const base = (datos.slug ?? datos.titulo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const estado = datos.estado ?? 'borrador';
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.curso)
        .insert({
          titulo: datos.titulo.trim(),
          slug: base,
          descripcion: datos.descripcion?.trim() || null,
          contenido: datos.contenido?.trim() || null,
          categoria_id: datos.categoria_id || null,
          portada_url: datos.portada_url || null,
          estado,
          precio: Number(datos.precio ?? 0),
          moneda: datos.moneda || 'PEN',
          xp_total: Number(datos.xp_total ?? 0),
          duracion_minutos: Number(datos.duracion_minutos ?? 0),
          creado_por: datos.creado_por ?? null,
          publicado_en: estado === 'publicado' ? new Date().toISOString() : null,
          actualizado_en: new Date().toISOString(),
        } as Record<string, unknown>)
        .select('id, slug')
        .single();
      if (error) return { ok: false, mensaje: error.message.includes('duplicate') ? 'Ya existe un curso con ese slug.' : error.message };
      const res = data as { id: string; slug: string };
      return { ok: true, mensaje: 'Curso creado correctamente.', id: res.id, slug: res.slug };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear el curso.' };
    }
  }

  /** Actualiza portada y datos básicos del curso (admin). */
  async actualizarCursoAdmin(id: string, cambios: Record<string, unknown>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.curso).update({ ...cambios, actualizado_en: new Date().toISOString() }).eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Curso actualizado.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar el curso.' };
    }
  }

  /** Crea una unidad en un curso (admin). */
  async crearUnidadAdmin(datos: {
    curso_id: string; numero: number; titulo: string; descripcion?: string | null;
    publicado?: boolean; xp_otorgado?: number; orden?: number;
  }): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.unidad).insert({
        curso_id: datos.curso_id, numero: Number(datos.numero), titulo: datos.titulo.trim(),
        descripcion: datos.descripcion?.trim() || null, publicado: datos.publicado ?? true,
        xp_otorgado: Number(datos.xp_otorgado ?? 0), creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString(),
      } as Record<string, unknown>);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Unidad creada correctamente.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear la unidad.' };
    }
  }
  /** Lista insignias para gestión admin. */
  async listarInsigniasAdmin(): Promise<import('../models/domain.models').Insignia[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.insignia).select('*').order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').Insignia[];
  }

  /** Crea una insignia (admin). */
  async crearInsigniaAdmin(datos: { codigo: string; nombre: string; descripcion?: string | null; icono?: string | null; xp_otorgado?: number; rareza?: string; activa?: boolean; }): Promise<{ ok: boolean; mensaje: string; id?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.insignia)
        .insert({ codigo: datos.codigo.trim(), nombre: datos.nombre.trim(), descripcion: datos.descripcion?.trim() || null, icono: datos.icono?.trim() || null, xp_otorgado: Number(datos.xp_otorgado ?? 0), rareza: datos.rareza || 'comun', activa: datos.activa ?? true, actualizado_en: new Date().toISOString() } as Record<string, unknown>)
        .select('id').single();
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Insignia creada correctamente.', id: (data as { id: string }).id };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear la insignia.' };
    }
  }

  /** Actualiza una insignia (admin). */
  async actualizarInsigniaAdmin(id: string, cambios: Record<string, unknown>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.insignia).update({ ...cambios, actualizado_en: new Date().toISOString() } as Record<string, unknown>).eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Insignia actualizada.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar la insignia.' };
    }
  }

  /** Crea una misión (admin). */
  async crearMisionAdmin(datos: {
    nombre: string; descripcion?: string | null; tipo?: string; objetivo_tipo?: string; objetivo_cantidad?: number;
    xp_recompensa?: number; monedas_recompensa?: number; insignia_id?: string | null; curso_id?: string | null;
    evento_id?: string | null; fecha_inicio?: string | null; fecha_fin?: string | null; activa?: boolean;
  }): Promise<{ ok: boolean; mensaje: string; id?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.mision)
        .insert({
          nombre: datos.nombre.trim(), descripcion: datos.descripcion?.trim() || null, tipo: datos.tipo || 'permanente',
          objetivo_tipo: datos.objetivo_tipo || 'lecciones_completadas', objetivo_cantidad: Number(datos.objetivo_cantidad ?? 1),
          xp_recompensa: Number(datos.xp_recompensa ?? 0), monedas_recompensa: Number(datos.monedas_recompensa ?? 0),
          insignia_id: datos.insignia_id || null, curso_id: datos.curso_id || null, evento_id: datos.evento_id || null,
          fecha_inicio: datos.fecha_inicio || null, fecha_fin: datos.fecha_fin || null, activa: datos.activa ?? true, actualizado_en: new Date().toISOString(),
        } as Record<string, unknown>)
        .select('id').single();
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Misión creada correctamente.', id: (data as { id: string }).id };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear la misión.' };
    }
  }

  /** Actualiza una misión (admin). */
  async actualizarMisionAdmin(id: string, cambios: Record<string, unknown>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.mision).update({ ...cambios, actualizado_en: new Date().toISOString() } as Record<string, unknown>).eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Misión actualizada.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar la misión.' };
    }
  }

  /** Crea un evento de gamificación (referencia/acceso). */
  async listarEventosParaMision(): Promise<import('../models/domain.models').EventoGamificacion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.eventoGamificacion).select('id, nombre, activo').order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../models/domain.models').EventoGamificacion[];
  }
  /* ---------------------------------------------- Creación admin --- */

  /** Crea un evento de gamificacion (admin). */
  async crearEventoGamificacionAdmin(datos: {
    nombre: string;
    descripcion?: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    activo?: boolean;
  }): Promise<{ ok: boolean; mensaje: string; id?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.eventoGamificacion)
        .insert({
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion?.trim() || null,
          fecha_inicio: datos.fecha_inicio,
          fecha_fin: datos.fecha_fin,
          activo: datos.activo ?? true,
          actualizado_en: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Evento creado correctamente.', id: (data as { id: string }).id };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear el evento.' };
    }
  }

  /** Actualiza un evento de gamificacion (admin). */
  async actualizarEventoGamificacionAdmin(id: string, cambios: Partial<{ nombre: string; descripcion: string | null; fecha_inicio: string; fecha_fin: string; activo: boolean; }>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const ext = cambios.descripcion !== undefined ? { ...cambios, descripcion: cambios.descripcion?.trim() || null } : cambios;
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.eventoGamificacion)
        .update({ ...ext, actualizado_en: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Evento actualizado.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar el evento.' };
    }
  }

  /** Crea un item de tienda (admin). */
  async crearTiendaItemAdmin(datos: {
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    tipo: string;
    precio_monedas?: number;
    precio_xp?: number;
    imagen_url?: string | null;
    datos?: Record<string, unknown> | null;
    stock?: number | null;
    limite_por_usuario?: number | null;
    activo?: boolean;
  }): Promise<{ ok: boolean; mensaje: string; id?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.tiendaItem)
        .insert({
          codigo: datos.codigo.trim(),
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion?.trim() || null,
          tipo: datos.tipo,
          precio_monedas: Number(datos.precio_monedas ?? 0),
          precio_xp: Number(datos.precio_xp ?? 0),
          imagen_url: datos.imagen_url?.trim() || null,
          datos: datos.datos ?? {},
          stock: datos.stock === undefined || datos.stock === null ? null : Number(datos.stock),
          limite_por_usuario: datos.limite_por_usuario === undefined || datos.limite_por_usuario === null ? null : Number(datos.limite_por_usuario),
          activo: datos.activo ?? true,
          actualizado_en: new Date().toISOString(),
        } as Record<string, unknown>)
        .select('id')
        .single();
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Articulo de tienda creado.', id: (data as { id: string }).id };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear el item.' };
    }
  }

  /** Actualiza un item de tienda (admin). */
  async actualizarTiendaItemAdmin(id: string, cambios: Partial<{ codigo: string; nombre: string; descripcion: string | null; tipo: string; precio_monedas: number; precio_xp: number; imagen_url: string | null; datos: Record<string, unknown>; stock: number | null; limite_por_usuario: number | null; activo: boolean; }>): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.tiendaItem)
        .update({ ...cambios, actualizado_en: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Articulo actualizado.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo actualizar el item.' };
    }
  }

  /** Lecciones del curso con contexto U/M (para selector admin de recursos). */
  async listarLeccionesDeCursoAdmin(cursoId: string): Promise<Array<{ id: string; titulo: string; numero: number; moduloTitulo: string; unidadTitulo: string; unidadNumero: number; }>> {
    const { data: unidades, error: e1 } = await this.supabase.client
      .from(this.supabase.tabla.unidad).select('id, titulo, numero').eq('curso_id', cursoId).order('numero');
    if (e1) throw new Error(e1.message);
    const us = (unidades ?? []) as { id: string; titulo: string; numero: number }[];
    if (us.length === 0) return [];
    const { data: modulos, error: e2 } = await this.supabase.client
      .from(this.supabase.tabla.modulo).select('id, titulo, unidad_id, numero').in('unidad_id', us.map((u) => u.id)).order('numero');
    if (e2) throw new Error(e2.message);
    const ms = (modulos ?? []) as { id: string; titulo: string; unidad_id: string; numero: number }[];
    if (ms.length === 0) return [];
    const { data: lecciones, error: e3 } = await this.supabase.client
      .from(this.supabase.tabla.leccion).select('id, titulo, numero, modulo_id').in('modulo_id', ms.map((m) => m.id)).order('numero');
    if (e3) throw new Error(e3.message);
    const ls = (lecciones ?? []) as { id: string; titulo: string; numero: number; modulo_id: string }[];
    const uMap = new Map(us.map((u) => [u.id, u]));
    const mMap = new Map(ms.map((m) => [m.id, m]));
    return ls.map((l) => {
      const m = mMap.get(l.modulo_id);
      const u = m ? uMap.get(m.unidad_id) : undefined;
      return { id: l.id, titulo: l.titulo, numero: l.numero, moduloTitulo: m?.titulo ?? '', unidadTitulo: u?.titulo ?? '', unidadNumero: u?.numero ?? 0 };
    });
  }

  /** Crea un recurso en una leccion (archivo o enlace). */
  async crearRecursoAdmin(datos: {
    leccion_id: string;
    contenido_id?: string | null;
    nombre: string;
    tipo: string;
    url?: string | null;
    ruta_storage?: string | null;
    tamano_bytes?: number | null;
    mime_type?: string | null;
    descargable?: boolean;
  }): Promise<{ ok: boolean; mensaje: string; id?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.recurso)
        .insert({ ...datos, descargable: !!datos.descargable, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() } as Record<string, unknown>)
        .select('id')
        .single();
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Recurso creado correctamente.', id: (data as { id: string }).id };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo crear el recurso.' };
    }
  }

  /** Elimina un recurso (admin). */
  async eliminarRecursoAdmin(id: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.from(this.supabase.tabla.recurso).delete().eq('id', id);
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Recurso eliminado.' };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo eliminar el recurso.' };
    }
  }

  /* ----------------------------------------------------- Auditoria --- */

  /** Registro de acciones de la plataforma. */
  async listarAuditoria(limite = 50): Promise<RegistroAccion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.registroAccion)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limite);

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as RegistroAccion[];
  }

  /** Auditoria de accesos. */
  async listarAccesos(limite = 50): Promise<AuditoriaAcceso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.auditoriaAcceso)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limite);

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as AuditoriaAcceso[];
  }

  /* -------------------------------------------------- Configuracion --- */

  /** Parametros configurables del sistema. */
  async listarParametros(): Promise<ParametroSistema[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.parametroSistema)
      .select('*')
      .order('categoria');

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as ParametroSistema[];
  }

  /** Configuracion de la aplicacion (sin los valores secretos). */
  async listarConfiguracion(): Promise<Configuracion[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.configuracion)
      .select('*')
      .eq('es_secreta', false)
      .order('categoria');

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as Configuracion[];
  }
}
