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

    try {
      // El backend es la unica fuente de verdad del perfil de aplicacion.
      const respuesta = await firstValueFrom(
        this.api.get<ApiResponse<PerfilBackend>>('/usuarios/yo'),
      );
      const datos = respuesta?.data;
      if (datos) {
        const perfil = adaptarPerfil(datos);
        this._perfil.set(perfil);
        void this.procesarSolicitudDocentePendiente();
        return perfil;
      }
      this._perfil.set(null);
      return null;
    } catch {
      // Fallback: la API de Spring no responde. Leemos el perfil directamente
      // de Supabase: la RLS permite que el dueno lea su propia fila.
      try {
        const { data, error } = await this.supabase.client
          .from(this.supabase.tabla.perfil)
          .select('*')
          .eq('id', usuario.id)
          .maybeSingle();
        if (error || !data) {
          this._perfil.set(null);
          return null;
        }
        const perfil = data as unknown as Perfil;
        this._perfil.set(perfil);
        void this.procesarSolicitudDocentePendiente();
        return perfil;
      } catch {
        this._perfil.set(null);
        return null;
      }
    }
  }

  /**
   * Si el usuario se registró como docente pero la verificación de correo impidió
   * crear la solicitud (sin sesión activa), se guarda localmente y se envía aquí
   * al iniciar sesión como estudiante. No autoasigna rol.
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
      return { ok: false, mensaje: 'La solicitud guardada localmente no es válida.' };
    }
    if (!payload?.institucion || !payload?.especialidad || !payload?.motivo) {
      localStorage.removeItem(key);
      return { ok: false, mensaje: 'La solicitud guardada está incompleta. Vuelve a enviarla.' };
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
   * Crea el perfil mínimo del usuario si no existe (idempotente).
   *
   * <p>La creación la hace el backend (que siempre asigna rol 'estudiante';
   * el cliente nunca puede elegir el rol). Esta función solo fuerza la
   * sincronización.</p>
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
      // la siguiente navegación volverá a intentarlo.
    }

    // Datos complementarios (género/nacimiento) solo si el ajuste los pide.
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
      await this.procesarSolicitudDocentePendiente();

      return { ok: true, mensaje: 'Sesión iniciada.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al iniciar sesión.',
      };
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
        mensaje: 'Si el correo está registrado, te enviaremos un enlace para restablecer la contraseña.',
      };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al recuperar la contraseña.',
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
      return { ok: true, mensaje: 'Contraseña actualizada correctamente.' };
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : 'Error inesperado al actualizar la contraseña.',
      };
    }
  }

  /**
   * Traduce los mensajes de Supabase a un texto comprensible para el usuario.
   */
  private traducirError(mensaje: string): string {
    const m = mensaje.toLowerCase();
    if (m.includes('invalid login credentials')) {
      return 'El correo o la contraseña no son correctos.';
    }
    if (m.includes('email not confirmed')) {
      return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
    }
    if (m.includes('user already registered')) {
      return 'Ya existe una cuenta con ese correo electrónico.';
    }
    if (m.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
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
