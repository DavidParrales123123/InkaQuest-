// @ts-nocheck
import { Injectable, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/** Curso al que pertenece el videojuego: Principios de Algoritmos. */
export const CURSO_PRINCIPIOS_ALGORITMOS = 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a';

export type EstadoAcceso = 'cargando' | 'permitido' | 'denegado';

/**
 * Controla quién puede VER y ACCEDER al videojuego Guardianes del Conocimiento.
 *
 * Reglas de acceso:
 *   - Estudiante: debe tener matrícula activa (o completada) en Principios de
 *     Algoritmos. Quien no esté inscrito, ni ve el enlace ni puede abrir la ruta.
 *   - Docente: debe estar asignado como docente ACTIVO del curso (tabla docente_curso).
 *   - Administrador: no se restringe (gestiona la plataforma).
 *
 * Fail-closed: ante un error de red el juego queda oculto. El RPC del servidor
 * sigue siendo la última línea de defensa.
 */
@Injectable({ providedIn: 'root' })
export class GuardianesAccesoService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  readonly accesoEstudiante = signal<EstadoAcceso>('cargando');
  readonly accesoDocente = signal<EstadoAcceso>('cargando');
  private verificacion: Promise<[boolean, boolean]> | null = null;
  private cargadoEn = 0;
  /** La inscripción puede ocurrir durante la sesión (pago): expira en 2 minutos. */
  private static readonly TTL_MS = 2 * 60 * 1000;

  /** Resuelve acceso estudiante (matriculo en el curso). */
  tieneAccesoEstudiante(): Promise<boolean> { return this.verificar().then(([est]) => est); }

  /** Resuelve acceso docente (asignado activo del curso). */
  tieneAccesoDocente(): Promise<boolean> { return this.verificar().then(([, doc]) => doc); }

  /** Carga el acceso para roles estudiante y docente (con TTL de 2 minutos). */
  async verificar(): Promise<[boolean, boolean]> {
    if (this.verificacion && Date.now() - this.cargadoEn < GuardianesAccesoService.TTL_MS) {
      return this.verificacion;
    }
    this.verificacion = this.cargar();
    return this.verificacion;
  }

  private async cargar(): Promise<[boolean, boolean]> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.accesoEstudiante.set('denegado');
      this.accesoDocente.set('denegado');
      this.cargadoEn = Date.now();
      return [false, false];
    }
    try {
      const sb = this.supabase.client;
      const [{ data: matr, error: matrErr }, { data: doc, error: docErr }] = await Promise.all([
        sb.from('matricula')
          .select('id')
          .eq('estudiante_id', usuario.id)
          .eq('curso_id', CURSO_PRINCIPIOS_ALGORITMOS)
          .in('estado', ['activa', 'completada'])
          .limit(1),
        sb.from('docente_curso')
          .select('id')
          .eq('docente_id', usuario.id)
          .eq('curso_id', CURSO_PRINCIPIOS_ALGORITMOS)
          .eq('activo', true)
          .limit(1),
      ]);
      if (matrErr) throw matrErr;
      if (docErr) throw docErr;
      const est = (matr?.length ?? 0) > 0;
      const docAsignado = (doc?.length ?? 0) > 0;
      this.accesoEstudiante.set(est ? 'permitido' : 'denegado');
      this.accesoDocente.set(docAsignado ? 'permitido' : 'denegado');
      this.cargadoEn = Date.now();
      return [est, docAsignado];
    } catch (e) {
      console.error('[guardianes] acceso:', e);
      this.accesoEstudiante.set('denegado');
      this.accesoDocente.set('denegado');
      this.cargadoEn = Date.now();
      return [false, false];
    }
  }
}
