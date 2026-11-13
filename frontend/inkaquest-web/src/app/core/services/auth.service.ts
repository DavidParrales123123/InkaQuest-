// @ts-nocheck
﻿// @ts-nocheck
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '@supabase/supabase-js';

import { SupabaseService } from '../services/supabase.service';
import { Perfil, RolUsuario } from '../models/domain.models';
import { adaptarPerfil, PerfilBackend } from '../models/perfil.mapper';
import { ApiClientService } from './api-client.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiClientService);

  private readonly _usuario = signal<User | null>(null);
  private readonly _perfil = signal<Perfil | null>(null);
  private readonly _cargando = signal<boolean>(true);

  /** Usuario de Supabase Auth (identidad). */
  readonly usuario = this._usuario.asReadonly();

  /** Perfil de aplicacion (rol, XP, nivel, etc.). */
  readonly perfil = this._perfil.asReadonly();

  /** Indica si se esta resolviendo la sesion inicial. */
  readonly cargando = this._cargando.asReadonly();

  /** Indica si hay una sesion activa. */
  readonly autenticado = computed(() => this._usuario() !== null);

  /** Se marca mientras el inicio de sesion esta en curso. */
  private readonly _iniciandoSesion = signal(false);
  /** Indica si un login esta en curso (usado por interceptores/guards). */
  readonly iniciandoSesion = this._iniciandoSesion.asReadonly();

  /** Rol efectivo del usuario. */
  readonly rol = computed<RolUsuario | null>(() => this._perfil()?.rol ?? null);

  /** Indica si el usuario es docente. */
  readonly esDocente = computed(() => this.rol() === 'docente');

  /** Indica si el usuario es administrador. */
  readonly esAdmin = computed(() => this.rol() === 'administrador');

  /** Indica si el usuario es estudiante. */
  readonly esEstudiante = computed(() => this.rol() === 'estudiante');

  constructor() {
    void this.iniciar();
  }

  /**
   * Restaura la sesion al arrancar la aplicacion.
   */
  private async iniciar(): Promise<void> {
    try {
      const { data } = await this.supabase.client.auth.getSession();
      this._usuario.set(data.session?.user ?? null);
      if (data.session?.user) {
        await this.cargarPerfil();
        if (!this._perfil()) {
          await this.asegurarPerfilBasico();
        }
      }
    } catch {
      this._usuario.set(null);
      this._perfil.set(null);
    } finally {
      this._cargando.set(false);
    }

    // Reactivo a cambios de sesion (expiracion, cierre en otra pestana).
    this.supabase.client.auth.onAuthStateChange((_evento, sesion) => {
      this._usuario.set(sesion?.user ?? null);
      if (sesion?.user) {
        void (async () => {
          await this.cargarPerfil();
          if (!this._perfil()) {
            await this.asegurarPerfilBasico();
          }
        })();
      } else {
        this._perfil.set(null);
      }
    });
  }

  /**
   * Carga (o recarga) el perfil de aplicacion del usuario autenticado.
   */
  async cargarPerfil(): Promise<Perfil | null> {
    const usuario = this._usuario();
    if (!usuario) {
      this._perfil.set(null);
      return null;
    }

    // 1) Fuente REST (principal).
    const perfilApi = await this.cargarPerfilDesdeApi();
    if (perfilApi) {
      this._perfil.set(perfilApi);
      void this.procesarSolicitudDocentePendiente();
      return perfilApi;
    }

    // 2) Fallback: Supabase directo (RLS permite leer la propia fila) o
    //    autocreacion del perfil propio si no existe.
    const perfilLocal = await this.cargarPerfilDesdeSupabase(usuario.id);
    if (perfilLocal) {
      this._perfil.set(perfilLocal);
      void this.procesarSolicitudDocentePendiente();
      return perfilLocal;
    }

    this._perfil.set(null);
    return null;
  }

  /** Lectura del perfil vÃ­a API REST. Devuelve null si falla o viene vacÃ­o. */
  private async cargarPerfilDesdeApi(): Promise<Perfil | null> {
    try {
      // El backend es la unica fuente de verdad del perfil de aplicacion.
      const respuesta = await firstValueFrom(
        this.api.get<ApiResponse<PerfilBackend>>('/usuarios/yo'),
      );
      const datos = respuesta?.data;
      if (datos) {
        return adaptarPerfil(datos);
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Lectura del perfil vÃ­a Supabase directo (+ autocreaciÃ³n si falta). */
  private async cargarPerfilDesdeSupabase(usuarioId: string): Promise<Perfil | null> {
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .select('*')
        .eq('id', usuarioId)
        .maybeSingle();
      if (!error && data) {
        return data as unknown as Perfil;
      }
      const perfil = await this.asegurarPerfilPropioSupabase();
      if (perfil) {
        return perfil;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Crea el perfil propio en public.perfil via Supabase (polÃ­tica INSERT del
   * propio usuario). Devuelve el perfil creado o null si no se pudo crear.
   */
  private async asegurarPerfilPropioSupabase(): Promise<Perfil | null> {
    const usuario = this._usuario();
    if (!usuario) {
      return null;
    }
    try {
      const nombre =
        (usuario.user_metadata as any)?.nombre?.trim() ||
        (usuario.user_metadata as any)?.full_name?.trim() ||
        (usuario.email ?? '').split('@')[0] ||
        'Usuario';
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .insert({ id: usuario.id, email: usuario.email ?? '', nombre });
      if (error) {
        console.warn('[InkaQuest] No se pudo crear el perfil propio:', error.message);
        return null;
      }
      const { data, error: err2 } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .select('*')
        .eq('id', usuario.id)
        .maybeSingle();
      if (err2 || !data) {
        return null;
      }
      return data as unknown as Perfil;
    } catch {
      return null;
    }
  }

  /**
   * Si el usuario se registrÃ³ como docente pero la verificaciÃ³n de correo impidiÃ³
   * crear la solicitud (sin sesiÃ³n activa), se guarda localmente y se envÃ­a aquÃ­
   * al iniciar sesiÃ³n como estudiante. No autoasigna rol.
   */
  async procesarSolicitudDocentePendiente(): Promise<{ ok: boolean; mensaje?: string }> {
    if (typeof localStorage === 'undefined') return { ok: false };
    const key = 'inkaquest.pendingTeacherRequest';
    const raw = localStorage.getItem(key);
    if (!raw) return { ok: false };

    const usuario = this._usuario();
    const perfil = this._perfil();
    if (!usuario || !perfil) return { ok: false };

    // Si ya no es estudiante, la solicitud no aplica (o ya fue procesada por admin).
    if (perfil.rol !== 'estudiante') {
      localStorage.removeItem(key);
      return { ok: true };
    }

    let payload: { institucion?: string; especialidad?: string; codigoDocente?: string; motivo?: string };
    try {
      payload = JSON.parse(raw) as { institucion?: string; especialidad?: string; codigoDocente?: string; motivo?: string };
    } catch {
      localStorage.removeItem(key);
      return { ok: false, mensaje: 'La solicitud guardada localmente no es vÃ¡lida.' };
    }
    if (!payload?.institucion || !payload?.especialidad || !payload?.motivo) {
      localStorage.removeItem(key);
      return { ok: false, mensaje: 'La solicitud guardada estÃ¡ incompleta. Vuelve a enviarla.' };
    }

    try {
      // El backend valida duplicados; nosotros solo enviamos el payload.
      await firstValueFrom(
        this.api.post<unknown>('/usuarios/yo/solicitud-docente', {
          institucion: payload.institucion,
          especialidad: payload.especialidad,
          codigoDocente: payload.codigoDocente ?? '',
          motivo: payload.motivo,
        }),
      );
      localStorage.removeItem(key);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo enviar la solicitud pendiente.',
      };
    }
  }

  /**
   * Crea el perfil mÃ­nimo del usuario si no existe (idempotente).
   *
   * <p>La creaciÃ³n la hace el backend (que siempre asigna rol 'estudiante';
   * el cliente nunca puede elegir el rol). Esta funciÃ³n solo fuerza la
   * sincronizaciÃ³n.</p>
   */
  async asegurarPerfilBasico(
    nombre?: string,
    genero?: string | null,
    fechaNacimiento?: string | null,
  ): Promise<void> {
    const usuario = this._usuario();
    if (!usuario) return;

    try {
      await firstValueFrom(this.api.post<unknown>('/usuarios/asegurar', { nombre: nombre ?? '' }));
    } catch {
      // Si el backend falla, seguimos sin romantizar un perfil incompleto;
      // la siguiente navegaciÃ³n volverÃ¡ a intentarlo.
    }

    // Datos complementarios (gÃ©nero/nacimiento) solo si el ajuste los pide.
    if (genero && (genero === 'masculino' || genero === 'femenino')) {
      try {
        await firstValueFrom(this.api.put('/usuarios/yo', { genero }));
      } catch { /* omitir */ }
    }
    if (fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
      try {
        await firstValueFrom(this.api.put('/usuarios/yo', { fechaNacimiento }));
      } catch { /* omitir */ }
    }

    await this.cargarPerfil();
    await this.procesarSolicitudDocentePendiente();
  }

  /**
   * Registra un nuevo usuario.
   *
   * <p>El rol lo decide la base de datos: el trigger de Supabase Auth crea el
   * perfil siempre como 'estudiante'. Para obtener el rol de docente hay que
   * enviar una solicitud, noauto-asignarse el rol.</p>
   *
   * @param email correo electronico
   * @param password contrasena
   * @param nombre nombre completo
   * @returns mensaje de exito o error
   */
  async registrar(
    email: string,
    password: string,
    nombre: string,
    genero?: 'masculino' | 'femenino' | null,
    fechaNacimiento?: string | null,
  ): Promise<{ ok: boolean; mensaje: string; requiereVerificacion: boolean }> {
    try {
      const nombreLimpio = nombre.trim();
      const generoLimpio = genero === 'masculino' || genero === 'femenino' ? genero : undefined;
      const fechaCandidata = (fechaNacimiento ?? '').trim();
      const fechaLimpia = /^\d{4}-\d{2}-\d{2}$/.test(fechaCandidata) ? fechaCandidata : undefined;
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombreLimpio,
            full_name: nombreLimpio,
            display_name: nombreLimpio,
            name: nombreLimpio,
            ...(generoLimpio ? { genero: generoLimpio } : {}),
            ...(fechaLimpia ? { fecha_nacimiento: fechaLimpia } : {}),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { ok: false, mensaje: this.traducirError(error.message), requiereVerificacion: false };
      }

      // Si no hay sesion activa, Supabase requiere confirmar el correo.
      const requiereVerificacion = data.session === null;

      if (!requiereVerificacion && data.user) {
        this._usuario.set(data.user);
        await this.asegurarPerfilBasico(nombreLimpio, generoLimpio ?? null, fechaLimpia ?? null);
        await this.cargarPerfil();
      }

      return {
        ok: true,
        mensaje: requiereVerificacion
          ? 'Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.'
          : 'Cuenta creada correctamente.',
        requiereVerificacion,
      };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al registrarse.',
        requiereVerificacion: false,
      };
    }
  }

  /**
   * Inicia sesion.
   */
  async iniciarSesion(
    email: string,
    password: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    this._iniciandoSesion.set(true);
    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { ok: false, mensaje: this.traducirError(error.message) };
      }

      this._usuario.set(data.user);
      await this.asegurarPerfilBasico();
      await this.cargarPerfil();
      if (!this._perfil()) {
        return {
          ok: false,
          mensaje: 'No pudimos conectar tu cuenta con el servidor en este momento (tu perfil no carga). Vuelve a intentarlo; si el problema persiste, escribe a soporte.',
        };
      }
      await this.procesarSolicitudDocentePendiente();

      return { ok: true, mensaje: 'SesiÃ³n iniciada.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al iniciar sesiÃ³n.',
      };
    } finally {
      this._iniciandoSesion.set(false);
    }
  }

  /**
   * Cierra la sesion actual.
   */
  async cerrarSesion(): Promise<void> {
    try {
      await this.supabase.client.auth.signOut();
    } finally {
      this._usuario.set(null);
      this._perfil.set(null);
      await this.router.navigate(['/']);
    }
  }

  /**
   * Envia el correo de recuperacion de contrasena.
   */
  async recuperarContrasena(email: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { ok: false, mensaje: this.traducirError(error.message) };
      }

      return {
        ok: true,
        mensaje: 'Si el correo estÃ¡ registrado, te enviaremos un enlace para restablecer la contraseÃ±a.',
      };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al recuperar la contraseÃ±a.',
      };
    }
  }

  /**
   * Actualiza la contrasena del usuario autenticado.
   */
  async actualizarContrasena(password: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { error } = await this.supabase.client.auth.updateUser({ password });
      if (error) {
        return { ok: false, mensaje: this.traducirError(error.message) };
      }
      return { ok: true, mensaje: 'ContraseÃ±a actualizada correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al actualizar la contraseÃ±a.',
      };
    }
  }

  /**
   * Traduce los mensajes de Supabase a un texto comprensible para el usuario.
   */
  private traducirError(mensaje: string): string {
    const m = mensaje.toLowerCase();
    if (m.includes('invalid login credentials')) {
      return 'El correo o la contraseÃ±a no son correctos.';
    }
    if (m.includes('email not confirmed')) {
      return 'Debes confirmar tu correo electrÃ³nico antes de iniciar sesiÃ³n.';
    }
    if (m.includes('user already registered')) {
      return 'Ya existe una cuenta con ese correo electrÃ³nico.';
    }
    if (m.includes('password should be at least')) {
      return 'La contraseÃ±a debe tener al menos 8 caracteres.';
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    }
    if (m.includes('fetch')) {
      return 'No se pudo conectar con el servidor. Verifica tu conexion.';
    }
    return mensaje;
  }
}
