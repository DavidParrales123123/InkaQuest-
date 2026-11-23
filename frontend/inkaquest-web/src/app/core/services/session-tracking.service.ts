import { Injectable, effect, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/**
 * Registra el tiempo en que la pestaña estuvo abierta/visible.
 *
 * <p>Se ejecuta en segundo plano: no pinta nada, no bloquea la navegación y
 * todos sus fallos se ignoran. El tiempo se acumula solo mientras la pestaña
 * está visible, se guarda cada 15 s y se cierra al ocultarse o al salir.</p>
 */
@Injectable({ providedIn: 'root' })
export class SessionTrackingService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private sesionId: string | null = null;
  private segundos = 0;
  private ultimoTick = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;
  private usuarioActual: string | null = null;
  private token: string | null = null;

  constructor() {
    // Arranca/detiene cuando cambia el usuario autenticado.
    effect(() => {
      const id = this.auth.usuario()?.id ?? null;
      if (id === this.usuarioActual) return;
      this.usuarioActual = id;
      if (id) void this.iniciar();
      else this.detener();
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.onVisibilidad());
      window.addEventListener('pagehide', () => this.cerrarConBeacon());
    }
  }

  private async iniciar(): Promise<void> {
    try {
      const { data: sesion } = await this.supabase.client.auth.getSession();
      this.token = sesion.session?.access_token ?? null;
      const { data, error } = await this.supabase.client.rpc('sesion_iniciar');
      if (error || !data || this.usuarioActual === null) return;
      this.sesionId = String(data);
      this.segundos = 0;
      this.ultimoTick = Date.now();
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 15_000);
    } catch {
      // Nunca debe afectar a la experiencia del usuario.
    }
  }

  private detener(): void {
    if (this.sesionId) this.flush(true);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.sesionId = null;
    this.segundos = 0;
    this.token = null;
  }

  private tick(): void {
    const ahora = Date.now();
    this.acumular(ahora);
    this.ultimoTick = ahora;
    this.flush(false);
  }

  private onVisibilidad(): void {
    const ahora = Date.now();
    if (document.visibilityState === 'visible') {
      this.ultimoTick = ahora;
    } else {
      this.acumular(ahora);
      this.ultimoTick = ahora;
      this.flush(false);
    }
  }

  private acumular(ahora: number): void {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const delta = Math.max(0, Math.floor((ahora - this.ultimoTick) / 1000));
    // Tope de seguridad por throttling de pestañas en segundo plano.
    this.segundos += Math.min(delta, 60);
  }

  private flush(cerrada: boolean): void {
    if (!this.sesionId) return;
    void Promise.resolve(this.supabase.client.rpc('sesion_actualizar', {
      p_id: this.sesionId,
      p_segundos: this.segundos,
      p_cerrada: cerrada,
    })).then(() => undefined).catch(() => undefined);
  }

  /** Último guardián al cerrar la pestaña (fetch con keepalive). */
  private cerrarConBeacon(): void {
    if (!this.sesionId || !this.token) return;
    void fetch(`${environment.supabaseUrl}/rest/v1/rpc/sesion_actualizar`, {
      method: 'POST',
      headers: {
        apikey: environment.supabaseAnonKey,
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_id: this.sesionId,
        p_segundos: this.segundos,
        p_cerrada: true,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }
}
