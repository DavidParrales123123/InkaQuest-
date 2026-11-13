// @ts-nocheck
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import {
  ActividadJuego,
  ConfiguracionJuego,
  IntentoJuego,
  Juego,
  Leccion,
  Modulo,
  Motor,
  MotorCurso,
  PuntuacionJuego,
  ResultadoJuego,
  Unidad,
  VersionMotor,
} from '../models/domain.models';

/**
 * Servicio de minijuegos y motores.
 *
 * <p><b>Arquitectura de motores preservada.</b> Cada motor del proyecto
 * ({@code public.motor}) mantiene su propia implementacion: este servicio lo
 * consulta y gestiona sus instancias de uso en cursos/lecciones. La
 * configuracion de contenidos permitida vive en {@code configuracion_juego}
 * (definida por administracion/backend) y la asignacion al curso en
 * {@code motor_curso}/{@code actividad_juego}, de modo que un docente puede
 * organizar y publicar actividades de juego segun sus cursos asignados sin
 * tocar la logica interna del motor.</p>
 *
 * <p>Las operaciones de escritura estan sujetas a RLS: docentes asignados
 * pueden gestionar {@code actividad_juego} y {@code motor_curso} de sus
 * cursos; la creacion/edicion de {@code juego} y {@code configuracion_juego}
 * es de administracion o backend autorizado.</p>
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly supabase = inject(SupabaseService);

  /* ------------------------------------------------------------ Motores --- */

  /** Catalogo de motores visibles (activos segun RLS). */
  async listarMotores(): Promise<Motor[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.motor)
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return (data ?? []) as Motor[];
  }

  /** Versiones publicadas/visibles de un motor. */
  async listarVersiones(motorId: string): Promise<VersionMotor[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.versionMotor)
      .select('*')
      .eq('motor_id', motorId)
      .order('publicada_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as VersionMotor[];
  }

  /** Motores asociados a un curso (visibles segun RLS). */
  async listarMotoresCurso(cursoId: string): Promise<MotorCurso[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.motorCurso)
      .select('*')
      .eq('curso_id', cursoId)
      .order('asignado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MotorCurso[];
  }

  /** Asocia un motor a un curso (docente del curso o admin). */
  async asignarMotorCurso(
    cursoId: string,
    motorId: string,
    asignadoPor: string | null,
  ): Promise<MotorCurso> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.motorCurso)
      .insert({
        curso_id: cursoId,
        motor_id: motorId,
        activo: true,
        es_comun: false,
        asignado_por: asignadoPor,
        asignado_en: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as MotorCurso;
  }

  /** Actualiza el estado/asociacion de un motor en curso. */
  async actualizarMotorCurso(
    id: string,
    cambios: Partial<Pick<MotorCurso, 'activo' | 'es_comun' | 'version_motor_id'>>,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.motorCurso)
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Quita la asociacion motor-curso. */
  async eliminarMotorCurso(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(this.supabase.tabla.motorCurso).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /* ------------------------------------------------------------ Juegos --- */

  /** Juegos de un motor concreto. */
  async listarJuegosPorMotor(motorId: string): Promise<Juego[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.juego)
      .select('*')
      .eq('motor_id', motorId)
      .order('nombre');
    if (error) throw new Error(error.message);
    return (data ?? []) as Juego[];
  }

  /** Catalogo de juegos visibles. */
  async listarJuegos(): Promise<Juego[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.juego)
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return (data ?? []) as Juego[];
  }

  /** Juegos publicados disponibles para asignar en actividades (catalogo). */
  async listarJuegosPublicados(): Promise<(Juego & { motor: Motor | null })[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.juego)
      .select('*, motor(*)')
      .eq('estado', 'publicado')
      .order('nombre');
    if (error) throw new Error(error.message);
    return ((data ?? []) as (Juego & { motor?: Motor | null })[]).map((j) => ({
      ...j,
      motor: j.motor ?? null,
    }));
  }

  /** Detalle de un juego con su motor. */
  async obtenerJuego(id: string): Promise<(Juego & { motor: Motor }) | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.juego)
      .select('*, motor(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as (Juego & { motor: Motor })) ?? null;
  }

  /* ------------------------------------------------- Actividades de juego --- */

  /** Detalle de una actividad de juego (docente/estudiante según RLS). */
  async obtenerActividadJuego(id: string): Promise<ActividadJuego | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.actividadJuego)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return (data as ActividadJuego) ?? null;
  }

  /** Guarda la duración real de la partida al finalizarla. */
  async actualizarDuracionIntento(id: string, duracionMs: number): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.intentoJuego)
      .update({ duracion_ms: Math.max(0, Math.round(duracionMs)), actualizado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Actividades de juego publicadas de un curso (vista estudiante). */
  async listarActividadesJuego(cursoId: string): Promise<ActividadJuego[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.actividadJuego)
      .select('*')
      .eq('curso_id', cursoId)
      .eq('publicado', true)
      .order('orden');
    if (error) throw new Error(error.message);
    return (data ?? []) as ActividadJuego[];
  }

  /** Actividades de juego de un curso para gestion docente (incluye no publicadas, segun RLS). */
  async listarActividadesJuegoGestion(cursoId: string): Promise<ActividadJuego[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.actividadJuego)
      .select('*')
      .eq('curso_id', cursoId)
      .order('orden')
      .order('creado_en');
    if (error) throw new Error(error.message);
    return (data ?? []) as ActividadJuego[];
  }

  /** Crea una actividad de juego asociada a un curso y leccion (docente del curso). */
  async crearActividadJuego(datos: {
    juego_id: string;
    leccion_id: string;
    curso_id: string;
    titulo: string;
    descripcion?: string | null;
    orden?: number;
    puntos?: number;
    xp_otorgado?: number;
    intentos_permitidos?: number;
    publicado?: boolean;
    actividad_id?: string | null;
  }): Promise<ActividadJuego> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.actividadJuego)
      .insert({
        juego_id: datos.juego_id,
        leccion_id: datos.leccion_id,
        curso_id: datos.curso_id,
        actividad_id: datos.actividad_id ?? null,
        titulo: datos.titulo,
        descripcion: datos.descripcion ?? null,
        orden: datos.orden ?? 0,
        puntos: datos.puntos ?? 0,
        xp_otorgado: datos.xp_otorgado ?? 0,
        intentos_permitidos: datos.intentos_permitidos ?? 0,
        publicado: datos.publicado ?? false,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as ActividadJuego;
  }

  /** Actualiza una actividad de juego. */
  async actualizarActividadJuego(
    id: string,
    cambios: Partial<
      Pick<
        ActividadJuego,
        | 'juego_id'
        | 'leccion_id'
        | 'titulo'
        | 'descripcion'
        | 'orden'
        | 'puntos'
        | 'xp_otorgado'
        | 'intentos_permitidos'
        | 'publicado'
        | 'actividad_id'
      >
    >,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.actividadJuego)
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Elimina una actividad de juego. */
  async eliminarActividadJuego(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(this.supabase.tabla.actividadJuego).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Configuracion de contenidos permitida de un juego (lectura). */
  async listarConfiguracionJuego(juegoId: string): Promise<ConfiguracionJuego[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.configuracionJuego)
      .select('*')
      .eq('juego_id', juegoId)
      .order('clave');
    if (error) throw new Error(error.message);
    return (data ?? []) as ConfiguracionJuego[];
  }

  /**
   * Crea o actualiza una entrada de configuración/contenido del juego.
   * El docente puede gestionar contenido (preguntas, respuestas, etc.) sin tocar el motor,
   * sujeto a RLS (docente asignado al curso que usa el juego, o admin).
   */
  async guardarConfiguracionJuego(
    juegoId: string,
    clave: string,
    valor: unknown,
    descripcion: string | null,
    id?: string | null,
  ): Promise<ConfiguracionJuego> {
    const payload = {
      juego_id: juegoId,
      clave: clave.trim(),
      valor: valor as any,
      descripcion: descripcion?.trim() || null,
      actualizado_en: new Date().toISOString(),
    };
    if (id) {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.configuracionJuego)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as ConfiguracionJuego;
    }
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.configuracionJuego)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as ConfiguracionJuego;
  }

  /** Elimina una entrada de configuración/contenido del juego (según RLS). */
  async eliminarConfiguracionJuego(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.supabase.tabla.configuracionJuego)
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Lecciones del curso con contexto de unidad/modulo (para selector de asignacion). */
  async listarLeccionesDeCurso(
    cursoId: string,
  ): Promise<(Leccion & { moduloTitulo: string; unidadTitulo: string; unidadNumero: number })[]> {
    const { data: unidades, error: e1 } = await this.supabase.client
      .from(this.supabase.tabla.unidad)
      .select('id, titulo, numero')
      .eq('curso_id', cursoId)
      .order('numero');
    if (e1) throw new Error(e1.message);
    const us = (unidades ?? []) as Pick<Unidad, 'id' | 'titulo' | 'numero'>[];
    if (us.length === 0) return [];
    const { data: modulos, error: e2 } = await this.supabase.client
      .from(this.supabase.tabla.modulo)
      .select('id, titulo, unidad_id, numero')
      .in('unidad_id', us.map((u) => u.id))
      .order('numero');
    if (e2) throw new Error(e2.message);
    const ms = (modulos ?? []) as Pick<Modulo, 'id' | 'titulo' | 'unidad_id' | 'numero'>[];
    if (ms.length === 0) return [];
    const { data: lecciones, error: e3 } = await this.supabase.client
      .from(this.supabase.tabla.leccion)
      .select('*')
      .in('modulo_id', ms.map((m) => m.id))
      .order('numero');
    if (e3) throw new Error(e3.message);
    const ls = (lecciones ?? []) as Leccion[];
    const uMap = new Map(us.map((u) => [u.id, u]));
    const mMap = new Map(ms.map((m) => [m.id, m]));
    return ls.map((l) => {
      const m = mMap.get(l.modulo_id);
      const u = m ? uMap.get(m.unidad_id) : undefined;
      return {
        ...l,
        moduloTitulo: m?.titulo ?? '',
        unidadTitulo: u?.titulo ?? '',
        unidadNumero: u?.numero ?? 0,
      };
    });
  }

  /**
   * Crea un minijuego completo (juego + contenido) usando un motor existente.
   *
   * <p>Llama a la RPC {@code fn_crear_juego_docente}, que verifica que el
   * docente esté asignado al curso destino. El juego queda PUBLICADO y
   * disponible para crear actividad en la lección.</p>
   */
  async crearJuegoDocente(datos: {
    cursoId: string;
    motorCodigo: string;
    nombre: string;
    descripcion: string | null;
    dificultad: 'facil' | 'media' | 'dificil';
    xpOtorgado: number;
    tiempoLimiteSeg?: number | null;
    contenido?: unknown;
  }): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('fn_crear_juego_docente', {
      p_curso_id: datos.cursoId,
      p_motor_codigo: datos.motorCodigo,
      p_nombre: datos.nombre,
      p_descripcion: datos.descripcion,
      p_dificultad: datos.dificultad,
      p_xp_otorgado: datos.xpOtorgado,
      p_tiempo_limite_seg: datos.tiempoLimiteSeg ?? null,
      p_contenido: datos.contenido ?? null,
    });

    if (error) {
      throw new Error(error.message ?? 'No se pudo crear el minijuego.');
    }
    if (!data) {
      throw new Error('La función no devolvió el identificador del juego.');
    }
    // La RPC devuelve un SETOF con una sola fila 'juego_id'.
    const primera = (data as Array<{ juego_id: string }>)[0];
    if (!primera?.juego_id) {
      throw new Error('Respuesta inesperada al crear el minijuego.');
    }
    return primera.juego_id;
  }

  /** Juegos creados por el docente autenticado (para la sección "Mis juegos"). */
  async listarMisJuegos(): Promise<(Juego & { motor: Motor | null })[]> {
    const user = await (async () => {
      const { data } = await this.supabase.client.auth.getUser();
      return data.user;
    })();
    if (!user) return [];
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.juego)
      .select('*, motor(*)')
      .eq('creado_por', user.id)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as (Juego & { motor?: Motor | null })[]).map((j) => ({
      ...j,
      motor: j.motor ?? null,
    }));
  }

  /* ---------------------------------------------------------- Intentos --- */

  /** Intentos del estudiante en las actividades de juego de un curso. */
  async listarMisIntentos(
    estudianteId: string,
    actividadJuegoIds: string[],
  ): Promise<IntentoJuego[]> {
    if (actividadJuegoIds.length === 0) return [];
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.intentoJuego)
      .select('*')
      .eq('estudiante_id', estudianteId)
      .in('actividad_juego_id', actividadJuegoIds)
      .order('numero', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as IntentoJuego[];
  }

  /** Crea un intento de juego. */
  async iniciarIntento(
    actividadJuegoId: string,
    estudianteId: string,
    numero: number,
    claveIdempotencia: string,
  ): Promise<{ ok: boolean; mensaje: string; intentoId: string | null }> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.intentoJuego)
        .insert({
          actividad_juego_id: actividadJuegoId,
          estudiante_id: estudianteId,
          numero,
          estado: 'en_curso',
          clave_idempotencia: claveIdempotencia,
          iniciado_en: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) return { ok: false, mensaje: error.message, intentoId: null };
      return { ok: true, mensaje: 'Partida iniciada.', intentoId: data['id'] as string };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo iniciar la partida.',
        intentoId: null,
      };
    }
  }

  /**
   * Registra el resultado de una partida.
   *
   * <p>Delega en {@code fn_registrar_resultado_juego}, que valida el intento y
   * reparte la recompensa. El frontend no calcula XP ni monedas.</p>
   */
  async registrarResultado(
    intentoId: string,
    puntaje: number,
    puntajeMaximo: number,
    precision: number,
    completitud: number,
    aciertos: number,
    errores: number,
    estrellas: number,
    completado: boolean,
    desglose: Record<string, unknown> = {},
  ): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.rpc('fn_registrar_resultado_juego', {
        p_intento_juego_id: intentoId,
        p_puntaje: puntaje,
        p_puntaje_maximo: puntajeMaximo,
        p_precision: precision,
        p_completitud: completitud,
        p_aciertos: aciertos,
        p_errores: errores,
        p_estrellas: estrellas,
        p_completado: completado,
        p_desglose: desglose,
      });
      if (error) return { ok: false, mensaje: error.message };
      return { ok: true, mensaje: 'Resultado registrado.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo registrar el resultado.',
      };
    }
  }

  /** Resultados de un intento. */
  async obtenerResultado(intentoId: string): Promise<ResultadoJuego | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.resultadoJuego)
      .select('*')
      .eq('intento_juego_id', intentoId)
      .maybeSingle();
    if (error) return null;
    return (data as ResultadoJuego) ?? null;
  }

  /** Puntuaciones acumuladas del usuario en un juego. */
  async obtenerPuntuacion(juegoId: string, usuarioId: string): Promise<PuntuacionJuego | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.puntuacionJuego)
      .select('*')
      .eq('juego_id', juegoId)
      .eq('usuario_id', usuarioId)
      .maybeSingle();
    if (error) return null;
    return (data as PuntuacionJuego) ?? null;
  }
}
